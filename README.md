# Just Ears Voice Receptionist Server

## Project Overview
Node.js backend service that integrates OpenAI's Realtime API with Twilio for voice calls and N8N workflows. This powers an AI voice receptionist (Robin) for Just Ears Clinic, handling appointment bookings and providing clinic information.

## Architecture

### Components
1. **Express Server** - HTTP server with WebSocket support
2. **OpenAI Realtime API Client** - Handles voice-based AI conversations with function calling
3. **Twilio Handler** - Manages incoming voice calls and media streams (G.711 μ-law audio)
4. **N8N Function Executor** - Calls N8N webhooks for business logic (availability checks, bookings, info retrieval)

### Key Files
- `server/config.ts` - Environment variable configuration
- `server/functions.ts` - N8N webhook integration for appointment operations
- `server/realtime-client.ts` - OpenAI Realtime API WebSocket client
- `server/twilio-handler.ts` - Twilio TwiML generation and webhook handlers
- `server/routes.ts` - Main route registration and WebSocket server setup

## Environment Variables
All credentials are stored in Replit Secrets:
- `OPENAI_API_KEY` - OpenAI API key for Realtime API access
- `TWILIO_ACCOUNT_SID` - Twilio account identifier
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `N8N_WEBHOOK_BASE_URL` - Base URL for N8N workflow webhooks
- `PORT` - Server port (default: 5000)

## API Endpoints

### HTTP Endpoints
- `GET /api/health` - Health check endpoint
- `POST /api/incoming-call` - Twilio webhook for incoming calls (returns TwiML)
- `POST /api/media-stream` - Twilio media stream webhook

### WebSocket Endpoint
- `wss://{host}/media-stream` - WebSocket endpoint for Twilio media streams

## How It Works

### Call Flow
1. **Incoming Call** → Twilio calls `/api/incoming-call`
2. **TwiML Response** → Returns TwiML with WebSocket stream URL
3. **WebSocket Connection** → Twilio establishes WebSocket connection to `/media-stream`
4. **OpenAI Connection** → Server opens connection to OpenAI Realtime API
5. **Audio Streaming** → Bidirectional audio streaming between Twilio ↔ OpenAI
6. **Function Calling** → OpenAI triggers N8N webhooks based on conversation
7. **N8N Processing** → N8N workflows handle availability checks, bookings, info retrieval
8. **Response** → Results flow back through OpenAI → Twilio → Caller

### N8N Webhook Functions
All three functions POST to `{N8N_WEBHOOK_BASE_URL}/voice-assistant` with different action types:

1. **check_appointment_availability**
   - Action: `check_availability`
   - Parameters: appointment_type, date, time, duration_minutes, location
   
2. **create_appointment**
   - Action: `create_appointment`
   - Parameters: patient_name, phone, appointment_type, start_datetime, end_datetime, location, notes

3. **get_clinic_information**
   - Action: `get_info`
   - Parameters: topic (microsuction, hearing-tests, custom-ear-plugs, locations, services)

## AI Assistant Personality
Robin is configured as a professional medical receptionist with:
- Warm, efficient communication style
- Knowledge of Just Ears Clinic services (microsuction, hearing tests, custom ear plugs, ENT consultations)
- Operating hours: Monday-Friday, 9 AM - 5 PM
- Emergency handling capabilities
- Alternative appointment suggestion logic

## Twilio Configuration
To use this server, configure your Twilio phone number webhook:
1. Go to Twilio Console → Phone Numbers
2. Select your phone number
3. Under "Voice & Fax", set "A CALL COMES IN" webhook to:
   - `https://{your-replit-url}/api/incoming-call`
   - Method: POST

## Running the Server
The server automatically starts via the "Start application" workflow:
```bash
npm run dev
```

Server will be available on port 5000 (or PORT environment variable).

## Tech Stack
- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express.js
- **WebSocket**: ws library
- **Twilio SDK**: Voice API and TwiML
- **OpenAI**: Realtime API (gpt-4o-realtime-preview-2024-10-01)
- **HTTP Client**: axios
- **Audio Format**: G.711 μ-law (8kHz, telephony standard)

## Recent Changes
- Initial implementation of voice receptionist server
- Integrated OpenAI Realtime API with function calling
- Connected Twilio voice streams with bidirectional audio
- Implemented N8N webhook integrations for appointment management

## Cloudflare worker

App:

[index.js](worker/index.js)

[wrangler toml](wrangler.toml)

Workflow scripts:

[package json](package.json)

### First time setup

```bash
npm install -D wrangler
```

Sign up to cloudflare, then login to cloudlfare:

```npx wrangler login```

I chose this subdomain:

https://just-ears-keepalive.just-ears-keepalive.workers.dev/

### Deploy the worker

The worker should auto-deploy whenever changes to the worker are pushed on Git.

```npm run worker:deploy```

### Monitor logs

```npm run worker:tail```
