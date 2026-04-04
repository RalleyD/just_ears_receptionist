import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { handleIncomingCall, handleMediaStream } from './twilio-handler';
import { handleConnection } from './realtime-client';
import { setAgentMode, getAgentMode } from "./runtime-config";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'Just Ears Voice Receptionist is running' });
  });

  // Twilio webhook for incoming calls
  app.post('/api/incoming-call', handleIncomingCall);

  // Twilio media stream webhook
  app.post('/api/media-stream', handleMediaStream);

  // Dashboard UI - Changes the agent's mode of operation
  app.post('/api/agent-mode', (req, res) => {
    console.log("Agent mode change received...")

    // extract the mode - common pattern for route handler - specific field is needed
    // destructure to pull a single property ->
    // from the Express JSON body.
    // expects req.body to be an object, and mode to exist there,
    // otherwise undefined and the code can continue
    const { mode } = req.body;
    
    // system boundary validation (strict non-equality, comparing type and value), 
    // before entering http layer
    if (mode !== 'normal' && mode !== 'out-of-office') {
      res.status(400).json({ error: 'Invalid mode' });
    }
    else {
      setAgentMode(mode);
      res.status(200).json(
        { status: 'Agent mode changed to: ' + mode.toString() }
      );
    }
  })

  app.get('/api/agent-mode', (req, res) => {
    return res.status(200).json({
      mode: getAgentMode()
    });
  })

  // wrap express app (passed by ref) in a Node.js HTTP server - 
  // to accept websocket connections
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
