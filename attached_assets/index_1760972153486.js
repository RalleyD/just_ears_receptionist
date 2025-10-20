const express = require('express');
const { urlencoded } = require('body-parser');
const config = require('./config');
const { handleIncomingCall, handleMediaStream } = require('./twilio-handler');

const app = express();

app.use(urlencoded({ extended: false }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Just Ears Voice Receptionist is running' });
});

// Twilio webhook for incoming calls
app.post('/incoming-call', handleIncomingCall);

// Twilio media stream webhook
app.post('/media-stream', handleMediaStream);

// Start server
const server = app.listen(config.server.port, () => {
  console.log(`Server running on port ${config.server.port}`);
  console.log(`Webhook URL: http://localhost:${config.server.port}/incoming-call`);
});

// WebSocket server for Twilio media streams
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection from Twilio');
  
  const realtimeClient = require('./realtime-client');
  realtimeClient.handleConnection(ws);
});

module.exports = app;
