import crypto from 'crypto';
import { GameState, Player } from '@shared/schema';

// Güvenlik anahtarları (production'da env'den alınmalı)
const SECRET_KEY = process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex');
const BUILD_VERSION = process.env.BUILD_VERSION || '1.0.0';

// Rate limiting için store
const rateLimitStore = new Map<string, number[]>();

// IP bazlı rate limiting
export function checkRateLimit(ip: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const requests = rateLimitStore.get(ip) || [];
  
  // Eski istekleri temizle
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limit aşıldı
  }
  
  validRequests.push(now);
  rateLimitStore.set(ip, validRequests);
  return true;
}

// WebSocket mesaj imzalama
export function signMessage(data: any): string {
  const message = JSON.stringify(data);
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(message);
  const signature = hmac.digest('hex');
  return `${message}.${signature}`;
}

// İmza doğrulama
export function verifyMessage(signedMessage: string): any | null {
  try {
    const [message, signature] = signedMessage.split('.');
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(message);
    const expectedSignature = hmac.digest('hex');
    
    if (signature === expectedSignature) {
      return JSON.parse(message);
    }
  } catch (error) {
    // Invalid message format
  }
  return null;
}

// Oyun durumu hash'leme (tampering detection)
export function hashGameState(gameState: GameState): string {
  const stateString = JSON.stringify({
    cards: gameState.cards,
    currentTeam: gameState.currentTeam,
    darkScore: gameState.darkScore,
    lightScore: gameState.lightScore,
    winner: gameState.winner
  });
  
  return crypto
    .createHash('sha256')
    .update(stateString)
    .digest('hex');
}

// Kritik oyun mantığı validasyonu
export function validateGameAction(
  gameState: GameState,
  player: Player,
  action: string,
  data: any
): { valid: boolean; reason?: string } {
  
  // Oyun durumu kontrolü
  if (gameState.phase === 'ended') {
    return { valid: false, reason: 'Oyun bitti' };
  }
  
  // Oyuncu yetki kontrolü
  switch (action) {
    case 'give_clue':
      if (player.role !== 'spymaster') {
        return { valid: false, reason: 'Sadece şefler ipucu verebilir' };
      }
      if (gameState.currentTeam !== player.team) {
        return { valid: false, reason: 'Sıra sizin takımda değil' };
      }
      break;
      
    case 'reveal_card':
      if (player.role !== 'guesser') {
        return { valid: false, reason: 'Sadece ajanlar kart açabilir' };
      }
      if (gameState.currentTeam !== player.team) {
        return { valid: false, reason: 'Sıra sizin takımda değil' };
      }
      break;
      
    case 'start_game':
      if (!player.isRoomOwner) {
        return { valid: false, reason: 'Sadece oda sahibi oyunu başlatabilir' };
      }
      break;
  }
  
  return { valid: true };
}

// Client integrity check
export function generateClientToken(playerId: string): string {
  const timestamp = Date.now();
  const data = `${playerId}:${timestamp}:${BUILD_VERSION}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(data);
  return `${data}:${hmac.digest('hex')}`;
}

export function verifyClientToken(token: string): boolean {
  try {
    const parts = token.split(':');
    if (parts.length !== 4) return false;
    
    const [playerId, timestamp, version, signature] = parts;
    const data = `${playerId}:${timestamp}:${version}`;
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(data);
    const expectedSignature = hmac.digest('hex');
    
    // Token süresi kontrolü (1 saat)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 3600000) return false;
    
    // Versiyon kontrolü
    if (version !== BUILD_VERSION) return false;
    
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

// Anti-bot challenge
export function generateChallenge(): { question: string; answer: string } {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operations = ['+', '-', '*'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  
  let answer: number;
  switch (op) {
    case '+': answer = num1 + num2; break;
    case '-': answer = num1 - num2; break;
    case '*': answer = num1 * num2; break;
    default: answer = 0;
  }
  
  return {
    question: `${num1} ${op} ${num2} = ?`,
    answer: answer.toString()
  };
}

// Telemetri ve anomali tespiti
export function logSuspiciousActivity(
  playerId: string,
  ip: string,
  action: string,
  details: any
): void {
  const log = {
    timestamp: new Date().toISOString(),
    playerId,
    ip,
    action,
    details,
    buildVersion: BUILD_VERSION
  };
  
  // Production'da bu loglar bir monitoring servisine gönderilmeli
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service
    // sendToMonitoring(log);
  }
}