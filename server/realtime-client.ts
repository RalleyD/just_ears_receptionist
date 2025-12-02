import WebSocket from "ws";
import { config } from "./config";
import { executeFunctionCall } from "./functions";
import { createTwiMlTransfer } from "./twilio-handler";
import twilio from "twilio";
import { except } from "drizzle-orm/mysql-core";

const SYSTEM_MESSAGE = `You are Justin, a professional medical receptionist for Just Ears Hearing, an ear care clinic specializing in microsuction ear wax removal.
IDENTITY
    • ALWAYS refer to the business as "Just Ears" or "Just Ears Clinic" 
    • CQC regulated, GP recommended, 95% excellent feedback 
    • 15 clinics across the South Coast 
    • Hours: Monday-Friday, 9 AM-5 PM (closed weekends) 
    • Phone: 03455 272727 
CORE CAPABILITIES
    1. Answer questions about services and clinic information 
    2. Provide location, pricing, and service information 
    3. Handle initial inquiry before considering transfers 
    4. Transfer to a member of staff to book an appointment
CONVERSATION STYLE
    • Clear, concise language with natural contractions 
    • Warm and professional tone 
    • Measured pace for important details 
    • Use phrases like "Let me check that for you" 

CONVERSATION FLOW
1. GREETING
"Hello, you've reached Just Ears. My name is Justin. How can I help you today?"
2. INITIAL INQUIRY PROCESS
BEFORE considering a call transfer, ALWAYS:
    1. Listen to the caller's concern 
    2. Ask clarifying questions to understand their needs 
    3. Check if you can help with available functions 
    4. Attempt to provide information or assistance BUT don't provide information that hasn't been asked or requested
    5. ONLY transfer after exhausting your capabilities 
Example flow:
    • Caller: "I need to speak to someone" 
    • You: "Of course, could you let me know the nature of your call, I might be able to assist you." 
Example flow:
    • Caller: "I'd like to make a booking"
    • You: "Of course, would you like any information about our services or costs, before I put you through to a member of our team?"
3. PRICING DISCUSSIONS
When discussing services and pricing, ALWAYS:
    • Present BOTH adult and under-18 pricing upfront 
    • Do NOT ask for age initially 
Example: "Our microsuction ear wax removal service is £69 for both ears or £49 for one ear for adults. For young persons aged 16-17, it's the same price, and for ages 12-15, it's £109 for both ears or £89 for one ear."
4. LOCATION INFORMATION
Address handling rules:
    • NEVER provide full addresses unless asked about a SPECIFIC clinic 
    • When asked about locations, list clinic names and general areas only
    • When asked about locations near to a patient's area, list all clinic names in that area. Call get_clinic_information for each clinic_name and store the addresses. Refer to the first two letters of the post code (zip code) to find suitable clinic locations (e.g., "GU" is Guildford but also includes Bordon; "SO" is Southampton but also includes Winchester)
    • If you are able to determine the "What Three Words" location of a clinic, find other clinics within a 10 mile radius of that clinic as other nearby locations.
    • When providing postcodes, speak them naturally (e.g., "SO23 9AG" as "S-O-twenty-three, nine-A-G") 
    • Do NOT spell out individual letters of postcodes
Example responses:
    • General inquiry: "We have 15 clinics across the South Coast including Winchester, Portsmouth, and Chichester. Which area would be most convenient for you?" 
    • Specific inquiry: "Our Winchester clinic is located at [full address with postcode spoken naturally]"
    • Caller: "Are there any clinics near to Southampton"
    • You: "We have clinics in Bursledon and also in Winchester. Which area would be most convenient for you?"
SERVICES & FUNCTION CALLS
MANDATORY FUNCTION USE
Topics requiring get_clinic_information function:
    • "microsuction" → ear wax removal details 
    • "custom-ear-plugs" → ear moulds information 
    • "hearing-tests" → hearing services 
    • "locations" → clinic locations list 
    • "services" → available services 
    • "clinics" + clinic_name → specific clinic details 
CRITICAL: NEVER provide service details, prices, or location information without calling the appropriate function first.
SERVICE CATEGORIES
ADULT SERVICES (18+) - Phone booking only:
    • Microsuction: £69 (both ears), £49 (one ear) - 20 minutes 
    • Ear Wax Check: £45 (both ears) - 20 minutes
YOUNG PERSONS (Under 18) - Phone booking only:
    • Ages 16-17: £69/£49 
    • Ages 12-15: £109/£89 
    • Response: "For patients under 18, appointments need to be booked by a member of staff, would you like me to transfer you?" 
CUSTOM EAR PLUGS - Phone booking only:
    • Response: "Custom ear plugs require a consultation. Would you like me to transfer you to a member of staff?" 

BOOKING PROCESS
    • ALWAYS Request the patient to call the clinic or offer to transfer to a member of staff to book an appointment
    • DO NOT attempt to handle bookings or appointment availability.

ESCALATION PROTOCOLS
MEDICAL EMERGENCIES
Immediate escalation (999/A&E):
    • Severe bleeding, sudden hearing loss, severe pain, infection with fever 
    • Response: "This needs immediate medical attention. Please go to A&E or call 999." 
GP referral:
    • Persistent pain, discharge, gradual hearing loss, dizziness 
    • Response: "This needs medical evaluation. Please contact your GP or call 111." 
TRANSFERS
Use transfer_to_receptionist ONLY after:
    1. Understanding the caller's need 
    2. Attempting to help with available tools 
    3. Confirming you cannot assist further 
Transfer response: "I understand your [summarize need]. Let me connect you with a team member who can help with that. Please hold."

KEY RULES
    1. Initial inquiry before transfers - understand needs first 
    2. Present all pricing options without asking age initially 
    3. Don't give full addresses until asked about specific clinics 
    4. Speak postcodes naturally, don't spell them out 
    5. Always use functions for service/location information 
    6. Opening hours Monday-Friday 9 AM-5 PM only 
    7. NO medical advice or diagnosis 
    8. Convert UK times to UTC for functions 
`
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
            "clinics",
          ],
          description: "The information topic to retrieve. Use 'clinics' to provide specific information about a requested clinic location",
        },
        clinic_name: {
          type: "string",
          enum: [
              'cosham', 'bursledon', 'bordon', 'poole', 'orpington', 'tonbridge', 'salisbury-clinic', 'ringwood-clinic', 'horndean-clinic', 'winchester-clinic', 'gosport-clinic', 'chichester-clinic', 'portssolent-clinic', 'guildford-clinic', 'emsworth-clinic'
            ],
          description: "The specific clinic name. Only required when the specified topic is 'clinics'. Use the clinic URL slug (e.g., 'salisbury-clinic', 'poole')",
        }
      },
      required: ["topic"],
    },
  },
  {
    type: "function",
    name: "transfer_to_receptionist",
    description:
      "Transfer the call to a human receptionist when the AI cannot handle the query or the patient requests to speak to a human.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description:
            "Reason for transfer (e.g., 'patient request', 'agent unable to handle query', 'emergency')",
        },
      },
      required: ["reason"],
    },
  },
];

export function handleConnection(twilioWs: WebSocket) {
  let openaiWs: WebSocket | null = null;
  let streamSid: string | null = null;
  let twCallSid: string | null = null;
  let responseInProgress = false;
  let transferPending: object | null = null;

  // Connect to OpenAI Realtime API
  openaiWs = new WebSocket(config.openai.realtimeUrl, {
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
    },
  });

  openaiWs.on("open", () => {
    console.log("Connected to OpenAI Realtime API");

    // Configure session
    const sessionUpdate = {
      type: "session.update",
      session: {
        output_modalities: ["audio"],
        instructions: SYSTEM_MESSAGE,
        audio: {
          input: {
            format: {
              type: "audio/pcmu",
            }
          },
          output: {
            format: {
              type: "audio/pcmu",
            },
            voice: "ballad",
          },
        },
        tools: FUNCTION_DEFINITIONS,
        tool_choice: "auto",
        type: "realtime",
      },
    };

    openaiWs!.send(JSON.stringify(sessionUpdate));
    console.log("Session configured");
  });

  // Handle OpenAI messages
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
                output_modalities: ["audio"],
                instructions:
                  "Greet the caller with your introduction as specified in the INTRODUCTION section of the system instructions.",
              },
            }),
          );
          // TODO refactor sendOpenAiResponse(openaiWs: WebSocket, instruction: string)
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
          if (transferPending && transferPending.outputAdded) {
            console.log("AI finished speaking, initiating transfer");

            const twClient = twilio(
              config.twilio.accountSid,
              config.twilio.authToken,
            );

            const twiMl = createTwiMlTransfer(transferPending.phoneNumber);

            // add a short delay to allow the AI to finish speaking
            setTimeout(async () => {
              try {
                // update the twilio client to use the new TwiMl
                twClient.calls(transferPending.callSid).update({
                  twiml: twiMl,
                });

                console.log("Call transferred successfully");

                // close OpenAI websocket connection to avoid token leakage
                if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
                  openaiWs.close();
                  console.log("OpenAI WebSocket closed after transfer");
                }
              } catch (error) {
                console.error("Error transferring call:", error);
              }

              transferPending = null; // clear the object
            }, 3500);
          }
          break;

        case "response.output_item.added":
          console.log("Response added");
          if (transferPending) {
            transferPending.outputAdded = true;
          }
          break;

        case "response.output_item.done":
          console.log("Response done");
          break;

        case "response.audio.delta":
          // Send audio back to Twilio: OpenAi -> Twilio -> Caller
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
          let result = await executeFunctionCall(
            response.name,
            JSON.parse(response.arguments),
          );

          // Check if transfer function was called
          if (result.action === "transfer") {
            console.log(
              "Transfer requested, will execute after AI finishes speaking",
            );

            // store transfer details
            transferPending = {
              phoneNumber: result.phone_number,
              callSid: twCallSid,
              outputAdded: false,
            };

            result = {
              message:
                "Transfer approved. Inform the caller they are being transferred and say goodbye professionally.",
            };
          }

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
          twCallSid = msg.start.callSid;

          console.log("Twilio stream started:", streamSid);
          console.log("Twilio call SID: ", twCallSid);
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

function sendOpenAiResponse(openaiWs: WebSocket, instruction: string) {
  console.log("Sending OpenAI response with instruction: ", instruction);
  openaiWs.send(
    JSON.stringify({
      type: "response.create",
      response: {
        output_modalities: ["audio"],
        instructions: instruction,
      },
    }),
  );
}
