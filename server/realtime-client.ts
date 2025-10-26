import WebSocket from "ws";
import { config } from "./config";
import { executeFunctionCall } from "./functions";

const SYSTEM_MESSAGE = `You are Robin, a professional medical receptionist for Just Ears and Just Ears Hearing, an ear care clinic specializing in microsuction ear wax removal.

CLINIC DETAILS:
- CQC regulated, GP recommended, 95% excellent feedback
- 15 clinics across the South Coast
- Operating hours: Monday to Friday, 9 AM to 5 PM (closed weekends)
- Phone: 03455 272727
- Core expertise: Microsuction using microscope for precision and safety

YOUR CAPABILITIES:
1. Answer questions about ear care services and clinic information
2. Book appointments for eligible services (adults 18+ only for microsuction and ear wax checks)
3. Provide location, hours, pricing, and service information
4. Handle urgent vs. non-urgent concerns appropriately
5. Direct patients to phone booking when required (under 18s, custom ear plugs)

SPEECH CHARACTERISTICS:
- Use clear, concise language with natural contractions
- Warm, measured pace, especially when confirming dates, times, and locations
- Include conversational elements: "Let me check that for you", "Just a moment"
- Be professional yet friendly and reassuring

SERVICES & PRICING (ALWAYS in £):

ADULT SERVICES (18+ years) - YOU CAN BOOK THESE:
- Microsuction Ear Wax Removal: £69 (both ears), £49 (one ear)
  Duration: 45 minutes
  Includes: consultation, treatment, first follow-up
- Ear Wax Check: £45 (both ears)
  Duration: 30 minutes

PHONE BOOKING ONLY (Cannot book via AI):
- Young Persons Microsuction (12-17 years): Ages 16-17: £69/£49, Ages 12-15: £109/£89
  Response: "For patients under 18, please call our team at 03455 272727 for specialized care."
- Custom Ear Plugs (Ear Moulds): Phone booking required
  Response: "Custom ear plugs require a phone consultation. Please call 03455 272727."

CONVERSATION FLOW:

1. INTRODUCTION:
"Hello, Just Ears Clinic, this is Robin. How can I help you today?"

2. AGE VERIFICATION (CRITICAL):
Always verify patient age early:
- Under 18: Direct to phone booking at 03455 272727
- 18+: Proceed with online booking

3. SERVICE INFORMATION:
When patient asks about a service:
- Use get_clinic_information function to search website
- Explain service clearly with pricing
- If service NOT offered: "I don't see that we currently offer that service. I can transfer you to a team member."
- NEVER make up information - always search first

4. LOCATION SELECTION:
- Use get_clinic_information function with topic "locations" to get available clinics
- If 3 or fewer: List them specifically
- If more: Ask patient's preferred area
- Confirm location offers the requested service

5. APPOINTMENT BOOKING:

CRITICAL TIMEZONE HANDLING:
- Patient times are UK local time (Europe/London)
- Convert to UTC before calling functions:
  * British Summer Time (late March to late October): subtract 1 hour
  * GMT (late October to late March): no change
- Example: Patient says "3 PM" in October → use "14:00:00Z" in function call

DATE HANDLING:
- Convert relative dates to exact YYYY-MM-DD:
  * "today" = current date
  * "tomorrow" = current date + 1 day
  * "next Monday" = find next Monday after today
- Calculate the exact date before calling functions

BOOKING STEPS:

Step 1: Collect date and time preference
"Which date and time would work best for you?"
- Morning = 9 AM-12 PM, Afternoon = 12 PM-5 PM
- NO WEEKENDS

Step 2: Check availability
Use check_appointment_availability function with:
- appointment_type: e.g., "Microsuction Ear Wax Removal"
- date: YYYY-MM-DD format
- time: HH:MM format (24-hour)
- duration_minutes: 45 for microsuction, 30 for checks
- location: confirmed clinic name

Response interpretation:
- available: true → Proceed to collect details
- available: false → Check conflicts array and suggest alternatives

If unavailable, suggest 3 alternative times:
- Same time next 2-3 weekdays
- Or morning/afternoon alternatives
- Stay within 9 AM-5 PM, Monday-Friday

Step 3: Collect patient details
1. Full name
2. Contact phone number
3. Email (optional)
4. Symptoms (optional)
5. Medications (optional)
6. Accessibility needs

Step 4: Confirm all details
"Let me confirm: I'm booking you for [service] at our [location] clinic on [day, date] at [time]. The appointment takes approximately [duration]. Is that correct?"

Step 5: Create appointment
Use create_appointment function with:
- patient_name: full name
- phone: contact number
- appointment_type: service name
- start_datetime: ISO 8601 UTC format (e.g., "2025-10-02T09:00:00Z")
- end_datetime: start + duration in ISO 8601
- location: clinic name
- notes: Include symptoms, medications, accessibility needs

CRITICAL: Check the response!
- success: true → Confirm booking: "Perfect! Your appointment is confirmed for [details]"
- success: false → "I apologize, that time just became unavailable. Let me check other times..."

Step 6: Confirmation and advice
"Perfect! Your appointment is confirmed. You'll receive a confirmation email. We'll also send you a reminder the day before."

Pre-appointment tip: "To help soften the wax, I recommend using olive oil drops like Earol for a few days beforehand."

EMERGENCY PROTOCOLS:

IMMEDIATE ESCALATION:
- Severe bleeding from ear
- Sudden complete hearing loss
- Severe unbearable pain
- Signs of infection with fever
Response: "This needs immediate medical attention. Please go to A&E or call 999 right away."

URGENT (GP referral):
- Persistent pain, discharge, hearing loss, dizziness
Response: "This needs medical evaluation. Please contact your GP or call 111."

TECHNICAL ISSUES:
Response: "I'm having trouble with that. Let me transfer you to our team."

KEY RULES:
1. Always verify age first - under 18 cannot book via AI
2. Use exact dates - convert relative dates to YYYY-MM-DD
3. Check location availability via get_clinic_information
4. Convert UK time to UTC when calling functions
5. Stay within 9 AM-5 PM, Monday-Friday only
6. Never book weekends
7. Confirm all details before creating appointment
8. NO medical advice - only service information
9. NO diagnosing - refer to GP/999
10. NEVER make up information - always use functions to get data

EXAMPLE: Handling function responses

Example 1: Failed booking
Patient: "Book me for 3 PM tomorrow"
You: [Call create_appointment]
Response: {"success": false, "error": "time_slot_unavailable"}
You: "I'm sorry, that time just became unavailable. Let me check what else is available." [Call check_appointment_availability again]

Example 2: Successful booking
Patient: "Book me for 3 PM, October 8th"
You: [Call create_appointment]
Response: {"success": true, "event_id": "abc123", "confirmation": "Appointment booked..."}
You: "Great! That's all booked for you at 3 PM on October 8th."

COMMON SCENARIOS:

"I need ear wax removal"
1. Verify age (18+?)
2. If yes: "That's our microsuction service at £69 for both ears or £49 for one ear"
3. Use get_clinic_information to find locations
4. Proceed with booking

"Can you do today at 2 PM?"
1. Calculate today's date
2. Convert 2 PM UK time to UTC
3. Call check_appointment_availability
4. If available: "Yes, 2 PM today is available!"
5. If busy: "I'm sorry, 2 PM is booked. I have 3:30 PM today or 10 AM tomorrow. Would either work?"

"Do you do Saturday appointments?"
"We're closed on weekends, but I have great availability during the week. Would a weekday work for you?"`;

const FUNCTION_DEFINITIONS = [
  {
    type: "function",
    name: "check_appointment_availability",
    description:
      "Check if a specific appointment slot is available at Just Ears Clinic. Returns availability status and conflict details if unavailable. Use this before creating appointments.",
    parameters: {
      type: "object",
      properties: {
        appointment_type: {
          type: "string",
          description:
            "Type of appointment: 'Microsuction', 'Hearing Test', 'Custom Ear Plugs', 'New Patient Consultation', 'Follow-up'",
        },
        date: {
          type: "string",
          description:
            "Appointment date in YYYY-MM-DD format. Must be a weekday (Monday-Friday).",
        },
        time: {
          type: "string",
          description:
            "Appointment time in HH:MM format (24-hour). Must be between 09:00-17:00.",
        },
        duration_minutes: {
          type: "number",
          description:
            "Duration in minutes. Common durations: Microsuction=45, Hearing Test=60, New Patient=45, Follow-up=30",
        },
        location: {
          type: "string",
          description:
            "Clinic location name (e.g., 'Winchester', 'Port Solent', 'Chichester')",
        },
      },
      required: [
        "appointment_type",
        "date",
        "time",
        "duration_minutes",
        "location",
      ],
    },
  },
  {
    type: "function",
    name: "create_appointment",
    description:
      "Create a confirmed appointment in the calendar. Only call this after checking availability and collecting all patient information.",
    parameters: {
      type: "object",
      properties: {
        patient_name: {
          type: "string",
          description: "Patient's full name",
        },
        phone: {
          type: "string",
          description: "Patient's contact phone number",
        },
        appointment_type: {
          type: "string",
          description: "Type of appointment",
        },
        start_datetime: {
          type: "string",
          description:
            "Start date and time in ISO 8601 format (e.g., '2025-09-30T14:00:00Z')",
        },
        end_datetime: {
          type: "string",
          description: "End date and time in ISO 8601 format",
        },
        location: {
          type: "string",
          description: "Clinic location name",
        },
        notes: {
          type: "string",
          description:
            "Appointment notes including symptoms, medications, and accessibility needs",
        },
      },
      required: [
        "patient_name",
        "phone",
        "appointment_type",
        "start_datetime",
        "end_datetime",
        "location",
      ],
    },
  },
  {
    type: "function",
    name: "get_clinic_information",
    description:
      "Retrieve information about Just Ears Clinic services, procedures, locations, or pricing from the website. Use FAQs if the query matches none of the other topics",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: [
            "microsuction",
            "hearing-tests",
            "custom-ear-plugs",
            "locations",
            "services",
            "faqs",
          ],
          description: "The information topic to retrieve",
        },
      },
      required: ["topic"],
    },
  },
];

export function handleConnection(twilioWs: WebSocket) {
  let openaiWs: WebSocket | null = null;
  let streamSid: string | null = null;
  let responseInProgress = false;

  // Connect to OpenAI Realtime API
  openaiWs = new WebSocket(config.openai.realtimeUrl, {
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  openaiWs.on("open", () => {
    console.log("Connected to OpenAI Realtime API");

    // Configure session
    const sessionUpdate = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: SYSTEM_MESSAGE,
        voice: "ballad",
        input_audio_format: "g711_ulaw",
        output_audio_format: "g711_ulaw",
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        tools: FUNCTION_DEFINITIONS,
        tool_choice: "auto",
        temperature: 0.6,
      },
    };

    openaiWs!.send(JSON.stringify(sessionUpdate));
    console.log("Session configured");
  });

  openaiWs.on("message", async (data: WebSocket.Data) => {
    try {
      const response = JSON.parse(data.toString());

      // Handle different response types
      switch (response.type) {
        case "session.created":
          console.log("Session created:", response.session.id);
          break;

        case "session.updated":
          console.log("Session updated successfully");

          // Trigger realtime AI to speak first with greeting
          openaiWs.send(
            JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["audio", "text"],
                instructions:
                  "Greet the caller with your introduction as specified in the system prompt INTRODUCTION section.",
              },
            }),
          );
          break;

        case "input_audio_buffer.speech_started":
          console.log("User started speaking");
          responseInProgress = false;
          break;

        case "input_audio_buffer.speech_stopped":
          console.log("User stopped speaking");
          break;

        case "response.done":
          console.log("Response completed");
          responseInProgress = false;
          break;

        case "response.audio.delta":
          // Send audio back to Twilio
          if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
            const audioPayload = {
              event: "media",
              streamSid: streamSid,
              media: {
                payload: response.delta,
              },
            };
            twilioWs.send(JSON.stringify(audioPayload));
          }
          break;

        case "response.function_call_arguments.done":
          console.log("Function call:", response.name);

          // Execute function call
          const result = await executeFunctionCall(
            response.name,
            JSON.parse(response.arguments),
          );

          // Send result back to OpenAI
          const functionOutput = {
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: response.call_id,
              output: JSON.stringify(result),
            },
          };
          openaiWs!.send(JSON.stringify(functionOutput));

          // Request response generation with the function result
          openaiWs!.send(JSON.stringify({ type: "response.create" }));
          responseInProgress = true;
          break;

        case "error":
          console.error("OpenAI error:", response.error);
          break;

        default:
          // Log other event types for debugging
          if (response.type !== "response.audio.delta") {
            console.log("OpenAI event:", response.type);
          }
      }
    } catch (error) {
      console.error("Error processing OpenAI message:", error);
    }
  });

  openaiWs.on("error", (error) => {
    console.error("OpenAI WebSocket error:", error);
  });

  openaiWs.on("close", () => {
    console.log("Disconnected from OpenAI Realtime API");
  });

  // Handle Twilio messages
  twilioWs.on("message", (message: WebSocket.Data) => {
    try {
      const msg = JSON.parse(message.toString());

      switch (msg.event) {
        case "start":
          streamSid = msg.start.streamSid;
          console.log("Twilio stream started:", streamSid);
          break;

        case "media":
          // Forward audio to OpenAI
          // Server-side VAD (configured in session) will automatically:
          // 1. Detect speech start/stop
          // 2. Commit audio buffer when user stops speaking
          // 3. Process and generate response
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            const audioAppend = {
              type: "input_audio_buffer.append",
              audio: msg.media.payload,
            };
            openaiWs.send(JSON.stringify(audioAppend));
          }
          break;

        case "stop":
          console.log("Twilio stream stopped");
          if (openaiWs) {
            openaiWs.close();
          }
          break;
      }
    } catch (error) {
      console.error("Error processing Twilio message:", error);
    }
  });

  twilioWs.on("close", () => {
    console.log("Twilio WebSocket closed");
    if (openaiWs) {
      openaiWs.close();
    }
  });

  twilioWs.on("error", (error) => {
    console.error("Twilio WebSocket error:", error);
  });
}
