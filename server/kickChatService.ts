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
  private maxHistorySize = 100;
  private isConnected = false;
  
  // Vote tracking for introduction phase
  private voteCollector: Map<string, 'like' | 'dislike'> = new Map();
  private activeVoteSession: string | null = null;
  
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
    const message: KickChatMessage = {
      id: data.id || Math.random().toString(36),
      username: data.sender?.username || 'Anonymous',
      content: data.content || '',
      badges: data.sender?.identity?.badges || [],
      color: data.sender?.identity?.color || '#FFFFFF',
      timestamp: Date.now()
    };
    
    // Add to history
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }
    
    // Check for vote commands during active vote session
    if (this.activeVoteSession) {
      this.processVote(message);
    }
    
    // Emit the message event
    this.emit('message', message);
  }
  
  private processVote(message: KickChatMessage): void {
    const content = message.content.trim();
    
    // Check for vote commands
    if (content === '1' || content.toLowerCase() === 'like') {
      if (!this.voteCollector.has(message.username)) {
        this.voteCollector.set(message.username, 'like');
        this.emit('vote', {
          username: message.username,
          vote: 'like',
          playerId: this.activeVoteSession
        });
      }
    } else if (content === '2' || content.toLowerCase() === 'dislike') {
      if (!this.voteCollector.has(message.username)) {
        this.voteCollector.set(message.username, 'dislike');
        this.emit('vote', {
          username: message.username,
          vote: 'dislike',
          playerId: this.activeVoteSession
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