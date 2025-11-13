import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

interface KickChatMessage {
  id: string;
  username: string;
  content: string;
  badges?: string[];
  color?: string;
  timestamp: number;
}

interface KickChatConfig {
  chatroomId: number;
  channelName?: string;
  enabled: boolean;
}

export class KickChatService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: KickChatConfig | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHistory: KickChatMessage[] = [];
  private maxHistorySize = 30; // Reduced to save memory
  private isConnected = false;
  
  // Vote tracking for introduction phase
  private voteCollector: Map<string, 'like' | 'dislike'> = new Map();
  private activeVoteSession: string | null = null;
  
  // Rate limiting and flood protection
  private userMessageTimestamps: Map<string, number[]> = new Map();
  private maxMessagesPerSecond = 3; // Max 3 messages per second per user
  private maxMessagesPerMinute = 30; // Max 30 messages per minute per user
  private bannedUsers: Set<string> = new Set(); // Temporarily banned users
  private lastMemoryCleanup = Date.now();
  
  private KICK_WS_URL = 'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false';
  
  constructor() {
    super();
    this.setMaxListeners(50); // Increase max listeners for multiple rooms
  }
  
  async connect(config: KickChatConfig): Promise<void> {
    if (!config.enabled || !config.chatroomId) {
      console.log('[KickChat] Service disabled or missing chatroom ID');
      return;
    }
    
    this.config = config;
    this.disconnect(); // Disconnect any existing connection
    
    return new Promise((resolve, reject) => {
      try {
        console.log('[KickChat] Connecting to Kick WebSocket...');
        this.ws = new WebSocket(this.KICK_WS_URL);
        
        this.ws.on('open', () => {
          console.log('[KickChat] WebSocket connected');
          this.isConnected = true;
          this.subscribeToChannel();
          resolve();
        });
        
        this.ws.on('message', (data: Buffer) => {
          this.handleMessage(data.toString());
        });
        
        this.ws.on('close', () => {
          console.log('[KickChat] WebSocket disconnected');
          this.isConnected = false;
          this.scheduleReconnect();
        });
        
        this.ws.on('error', (error) => {
          console.error('[KickChat] WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private subscribeToChannel(): void {
    if (!this.ws || !this.config) return;
    
    const channelName = `chatrooms.${this.config.chatroomId}.v2`;
    const subscribePayload = {
      event: 'pusher:subscribe',
      data: {
        auth: '',
        channel: channelName
      }
    };
    
    this.ws.send(JSON.stringify(subscribePayload));
    console.log('[KickChat] Subscribed to channel:', channelName);
  }
  
  private handleMessage(rawData: string): void {
    try {
      const outer = JSON.parse(rawData);
      
      // Handle different event types
      if (outer.event === 'App\\Events\\ChatMessageEvent') {
        const inner = JSON.parse(outer.data);
        this.processChatMessage(inner);
      } else if (outer.event === 'pusher_internal:subscription_succeeded') {
        console.log('[KickChat] Successfully subscribed to chat');
        this.emit('connected');
      }
    } catch (error) {
      // Silently ignore parse errors for non-chat messages
    }
  }
  
  private processChatMessage(data: any): void {
    const username = data.sender?.username || 'Anonymous';
    
    // Clean up old data periodically (every 5 minutes)
    const now = Date.now();
    if (now - this.lastMemoryCleanup > 300000) {
      this.cleanupMemory();
      this.lastMemoryCleanup = now;
    }
    
    // Check if user is temporarily banned
    if (this.bannedUsers.has(username)) {
      return; // Silently ignore messages from banned users
    }
    
    // Rate limiting check
    if (!this.checkRateLimit(username)) {
      console.log(`[KickChat] Rate limit exceeded for user: ${username}`);
      // Temporarily ban user for 1 minute if they're flooding
      this.bannedUsers.add(username);
      setTimeout(() => this.bannedUsers.delete(username), 60000);
      return;
    }
    
    const message: KickChatMessage = {
      id: data.id || Math.random().toString(36),
      username: username,
      content: data.content || '',
      badges: data.sender?.identity?.badges || [],
      color: data.sender?.identity?.color || '#FFFFFF',
      timestamp: Date.now()
    };
    
    // Add to history with strict limit
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize); // Keep only last N messages
    }
    
    // Check for vote commands during active vote session
    if (this.activeVoteSession) {
      this.processVote(message);
    }
    
    // Emit the message event with chatroomId
    this.emit('message', { ...message, chatroomId: this.config?.chatroomId });
  }
  
  private checkRateLimit(username: string): boolean {
    const now = Date.now();
    const timestamps = this.userMessageTimestamps.get(username) || [];
    
    // Remove timestamps older than 1 minute
    const recentTimestamps = timestamps.filter(t => now - t < 60000);
    
    // Check per-second limit (sliding window)
    const lastSecondTimestamps = recentTimestamps.filter(t => now - t < 1000);
    if (lastSecondTimestamps.length >= this.maxMessagesPerSecond) {
      return false;
    }
    
    // Check per-minute limit
    if (recentTimestamps.length >= this.maxMessagesPerMinute) {
      return false;
    }
    
    // Add current timestamp
    recentTimestamps.push(now);
    this.userMessageTimestamps.set(username, recentTimestamps);
    
    return true;
  }
  
  private cleanupMemory(): void {
    // Clear old rate limit data
    const now = Date.now();
    for (const [username, timestamps] of this.userMessageTimestamps.entries()) {
      const recentTimestamps = timestamps.filter(t => now - t < 60000);
      if (recentTimestamps.length === 0) {
        this.userMessageTimestamps.delete(username);
      } else {
        this.userMessageTimestamps.set(username, recentTimestamps);
      }
    }
    
    // Clear old vote data if session ended
    if (!this.activeVoteSession && this.voteCollector.size > 0) {
      this.voteCollector.clear();
    }
    
    // Ensure message history doesn't grow beyond limit
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
    }
    
    console.log(`[KickChat] Memory cleanup completed. Active users: ${this.userMessageTimestamps.size}`);
  }
  
  private processVote(message: KickChatMessage): void {
    const content = message.content.trim();
    
    // Check for vote commands
    if (content === '1' || content.toLowerCase() === 'like') {
      const previousVote = this.voteCollector.get(message.username);
      
      // Update vote if it's new or different
      if (previousVote !== 'like') {
        this.voteCollector.set(message.username, 'like');
        this.emit('vote', {
          username: message.username,
          vote: 'like',
          previousVote: previousVote || null,
          playerId: this.activeVoteSession,
          chatroomId: this.config?.chatroomId
        });
      }
    } else if (content === '2' || content.toLowerCase() === 'dislike') {
      const previousVote = this.voteCollector.get(message.username);
      
      // Update vote if it's new or different
      if (previousVote !== 'dislike') {
        this.voteCollector.set(message.username, 'dislike');
        this.emit('vote', {
          username: message.username,
          vote: 'dislike',
          previousVote: previousVote || null,
          playerId: this.activeVoteSession,
          chatroomId: this.config?.chatroomId
        });
      }
    }
  }
  
  startVoteSession(playerId: string): void {
    this.activeVoteSession = playerId;
    this.voteCollector.clear();
    console.log('[KickChat] Started vote session for player:', playerId);
    
    // Announce in chat (if we had write access)
    // For now, just emit an event
    this.emit('voteSessionStarted', playerId);
  }
  
  endVoteSession(): { likes: number; dislikes: number } {
    const results = {
      likes: Array.from(this.voteCollector.values()).filter(v => v === 'like').length,
      dislikes: Array.from(this.voteCollector.values()).filter(v => v === 'dislike').length
    };
    
    this.activeVoteSession = null;
    this.voteCollector.clear();
    
    console.log('[KickChat] Vote session ended. Results:', results);
    return results;
  }
  
  getRecentMessages(count: number = 50): KickChatMessage[] {
    return this.messageHistory.slice(-count);
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      if (this.config && this.config.enabled) {
        console.log('[KickChat] Attempting to reconnect...');
        this.connect(this.config);
      }
    }, 5000);
  }
  
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.messageHistory = [];
    this.voteCollector.clear();
    this.activeVoteSession = null;
    
    // Clear rate limiting data
    this.userMessageTimestamps.clear();
    this.bannedUsers.clear();
  }
  
  isActive(): boolean {
    return this.isConnected;
  }
  
  updateConfig(config: KickChatConfig): void {
    const needsReconnect = 
      this.config?.chatroomId !== config.chatroomId ||
      this.config?.enabled !== config.enabled;
    
    this.config = config;
    
    if (needsReconnect) {
      if (config.enabled) {
        this.connect(config);
      } else {
        this.disconnect();
      }
    }
  }
}

// Singleton instance
export const kickChatService = new KickChatService();