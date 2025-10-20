# Just Ears Voice Receptionist - Setup Guide

## ✅ Server Status
Your Node.js voice receptionist server is **running and ready**!

## 🔧 What's Configured

### Environment Variables (Already Set)
- ✅ `OPENAI_API_KEY` - OpenAI Realtime API access
- ✅ `TWILIO_ACCOUNT_SID` - Twilio account identifier  
- ✅ `TWILIO_AUTH_TOKEN` - Twilio authentication
- ✅ `N8N_WEBHOOK_BASE_URL` - N8N workflow endpoint

### Server Endpoints
- **Health Check**: `GET /api/health`
- **Incoming Calls**: `POST /api/incoming-call` (Twilio webhook)
- **Media Stream**: `POST /api/media-stream` (Twilio webhook)
- **WebSocket**: `wss://{your-url}/media-stream` (Twilio audio stream)

## 📞 Connecting Your Twilio Phone Number

### Step 1: Get Your Replit URL
Your server is running at: `https://{your-replit-url}`

### Step 2: Configure Twilio Webhook
1. Log into [Twilio Console](https://console.twilio.com)
2. Go to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your phone number
4. Scroll to **Voice Configuration**
5. Under "A CALL COMES IN":
   - **Webhook URL**: `https://{your-replit-url}/api/incoming-call`
   - **HTTP Method**: `POST`
6. Click **Save**

### Step 3: Test Your Setup
Call your Twilio phone number! You should hear Robin, the AI receptionist, answer and start a conversation.

## 🤖 How It Works

### Call Flow
```
Caller → Twilio → Your Server → OpenAI Realtime API
                      ↓
                  N8N Webhooks
               (Appointments & Info)
```

1. **Incoming Call**: Twilio sends request to `/api/incoming-call`
2. **TwiML Response**: Server returns WebSocket connection instructions
3. **Audio Streaming**: Bidirectional audio flows between Twilio ↔ OpenAI
4. **AI Processing**: OpenAI's GPT-4 processes voice and makes decisions
5. **Function Calls**: When booking appointments, OpenAI calls your N8N webhooks
6. **N8N Processing**: Your N8N workflows handle:
   - Checking appointment availability
   - Creating new appointments
   - Retrieving clinic information

### AI Assistant (Robin) Capabilities
- ✅ Answer questions about clinic services
- ✅ Check real-time appointment availability
- ✅ Book appointments with patient details
- ✅ Suggest alternative times if slots are unavailable
- ✅ Provide clinic location and pricing information
- ✅ Handle emergency situations appropriately

### Business Hours
- **Operating Hours**: Monday-Friday, 9 AM - 5 PM
- **Closed**: Weekends
- **Services**: Microsuction, Hearing Tests, Custom Ear Plugs, ENT Consultations

## 🔗 N8N Webhook Integration

Your server sends requests to: `{N8N_WEBHOOK_BASE_URL}/voice-assistant`

### Expected N8N Webhook Actions

#### 1. Check Availability
```json
{
  "action": "check_availability",
  "appointment_type": "Microsuction",
  "date": "2025-10-25",
  "time": "14:00",
  "duration_minutes": 45,
  "location": "Winchester"
}
```

#### 2. Create Appointment
```json
{
  "action": "create_appointment",
  "patient_name": "John Smith",
  "phone": "+441234567890",
  "appointment_type": "Microsuction",
  "start_datetime": "2025-10-25T14:00:00Z",
  "end_datetime": "2025-10-25T14:45:00Z",
  "location": "Winchester",
  "notes": "First time patient, no known allergies"
}
```

#### 3. Get Information
```json
{
  "action": "get_info",
  "topic": "microsuction"
}
```
*Topics: microsuction, hearing-tests, custom-ear-plugs, locations, services*

## 🧪 Testing

### Test Health Endpoint
```bash
curl https://{your-replit-url}/api/health
```
Expected: `{"status":"Just Ears Voice Receptionist is running"}`

### Test Voice Call
1. Call your Twilio phone number
2. Wait for Robin to answer
3. Try asking: "What services do you offer?"
4. Try booking: "I'd like to book a microsuction appointment"

## 🛠️ Troubleshooting

### Server Not Responding
- Check the "Start application" workflow is running
- Verify all environment variables are set in Replit Secrets

### No Audio on Calls
- Verify Twilio webhook URL is correct (must use HTTPS)
- Check server logs for WebSocket connection messages
- Ensure OpenAI API key has Realtime API access

### Function Calls Not Working
- Verify N8N_WEBHOOK_BASE_URL is accessible
- Check N8N workflow is deployed and accepting requests
- Review server logs for N8N response errors

### View Server Logs
Server logs show real-time events:
- WebSocket connections
- OpenAI session events
- Function call executions
- Audio streaming status

## 📊 Monitoring

Watch for these log messages:
- ✅ `Connected to OpenAI Realtime API`
- ✅ `Session configured`
- ✅ `New WebSocket connection from Twilio`
- ✅ `Twilio stream started: {streamSid}`
- ✅ `Function call: {functionName}`

## 🚀 Next Steps

1. **Configure Twilio Webhook** (see Step 2 above)
2. **Ensure N8N Workflows Are Ready**:
   - Appointment availability checker
   - Appointment creation handler
   - Clinic information retriever
3. **Test with a Real Call**
4. **Monitor and Adjust**:
   - Review conversation quality
   - Fine-tune N8N workflows
   - Adjust AI instructions if needed

## 📝 Need to Modify AI Behavior?

Edit `server/realtime-client.ts` and update the `SYSTEM_MESSAGE` constant to change:
- Robin's personality and tone
- Conversation guidelines
- Booking process steps
- Operating hours and constraints

## 💡 Tips

- **Audio Quality**: The system uses G.711 μ-law codec (telephony standard)
- **Response Time**: Typically 200-500ms for AI responses
- **Function Calls**: OpenAI decides when to call N8N functions based on conversation
- **Turn Detection**: Server-side VAD automatically detects when caller stops speaking

---

**Your voice receptionist is ready to handle calls!** 📞
