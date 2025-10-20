require('dotenv').config();

module.exports = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    realtimeUrl: 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01'
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN
  },
  n8n: {
    baseUrl: process.env.N8N_WEBHOOK_BASE_URL
  },
  server: {
    port: process.env.PORT || 3000
  }
};
