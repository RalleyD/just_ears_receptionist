const twilio = require('twilio');
const config = require('./config');

const VoiceResponse = twilio.twiml.VoiceResponse;

function handleIncomingCall(req, res) {
  console.log('Incoming call received');
  
  const response = new VoiceResponse();
  
  // Connect to media stream
  const connect = response.connect();
  connect.stream({
    url: `wss://${req.headers.host}/media-stream`
  });

  res.type('text/xml');
  res.send(response.toString());
}

function handleMediaStream(req, res) {
  console.log('Media stream webhook hit');
  res.sendStatus(200);
}

module.exports = {
  handleIncomingCall,
  handleMediaStream
};
