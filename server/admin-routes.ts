import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Admin configuration
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Default for development
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>(); // IP -> attempts
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Rate limiting helper
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if outside window
  if (now - attempts.lastAttempt > LOGIN_ATTEMPT_WINDOW) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Check if exceeded
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  
  // Increment
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

// Admin authentication middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token
  
  if (!token || !storage.validateAdminSession(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

export function registerAdminRoutes(app: Express): void {
  // Admin login endpoint
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }
    
    const { password } = req.body;
    
    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    const token = storage.createAdminSession();
    res.json({ token });
  });

  // Admin logout endpoint
  app.post('/api/admin/logout', requireAdmin, (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      storage.deleteAdminSession(token);
    }
    res.json({ success: true });
  });

  // Admin overview endpoint
  app.get('/api/admin/overview', requireAdmin, (req: Request, res: Response) => {
    const overview = storage.getAdminOverview();
    res.json(overview);
  });

  // Admin rooms endpoint
  app.get('/api/admin/rooms', requireAdmin, (req: Request, res: Response) => {
    const rooms = storage.getAdminRooms();
    res.json(rooms);
  });

  // Admin room details endpoint
  app.get('/api/admin/rooms/:code', requireAdmin, (req: Request, res: Response) => {
    const { code } = req.params;
    const details = storage.getAdminRoomDetails(code);
    
    if (!details) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(details);
  });

  // Admin players endpoint
  app.get('/api/admin/players', requireAdmin, (req: Request, res: Response) => {
    const players = storage.getAdminPlayers();
    res.json(players);
  });
}