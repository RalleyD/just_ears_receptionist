import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { handleIncomingCall, handleMediaStream } from './twilio-handler';
import { handleConnection } from './realtime-client';

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'Just Ears Voice Receptionist is running' });
  });

  // Twilio webhook for incoming calls
  app.post('/api/incoming-call', handleIncomingCall);

  // Twilio media stream webhook
  app.post('/api/media-stream', handleMediaStream);

  const httpServer = createServer(app);

  // WebSocket server for Twilio media streams
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/media-stream'
  });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection from Twilio');
    handleConnection(ws);
  });

  return httpServer;
}
