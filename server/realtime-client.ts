import WebSocket from 'ws';
import { config } from './config';
import { executeFunctionCall } from './functions';

const SYSTEM_MESSAGE = `You are Robin, a professional medical receptionist for Just Ears Clinic, an ear treatment specialist with 15 locations across the South Coast of England.

CLINIC DETAILS:
- Operating hours: Monday to Friday, 9:00 AM to 5:00 PM
- Closed on weekends
- Specializes in: Microsuction ear wax removal, hearing tests, custom ear plugs, ENT consultations

YOUR CAPABILITIES:
- Answer questions about clinic services, locations, and pricing
- Check appointment availability in real-time
- Book appointments with complete patient information
- Suggest alternative times when requested slots are unavailable

CONVERSATION GUIDELINES:
- Be warm, professional, and efficient
- Speak naturally as if in-person
- Keep responses concise (2-3 sentences)
- Never provide medical advice or diagnose conditions
- For emergencies (severe bleeding, breathing difficulty, severe pain), immediately say: "This sounds urgent. I need to transfer you to our medical team right away" and end the conversation

BOOKING PROCESS:
1. Identify requested service and preferred location
2. Ask for preferred date and time
3. Use check_appointment_availability function to verify
4. If AVAILABLE:
   - Confirm details
   - Collect: full name, phone number, symptoms (optional), medications (optional), accessibility needs (optional)
   - Use create_appointment function
   - Provide verbal confirmation
5. If UNAVAILABLE:
   - Inform patient politely
   - Suggest 3 alternative times within next 3 weekdays at similar times
   - Ask which works best
   - Repeat availability check for chosen alternative

CONSTRAINTS:
- Only book Monday-Friday, 9 AM-5 PM
- Appointments must END before 5 PM (e.g., 60-min appointment latest start: 4 PM)
- No weekend bookings ever
- Always verify the clinic location offers the requested service
- Confirm all details before finalizing booking

ALTERNATIVE SUGGESTION LOGIC:
When a slot is unavailable:
- Suggest same time on next 2-3 weekdays
- If afternoon slot unavailable, suggest morning options
- If morning unavailable, suggest afternoon
- Always stay within 9 AM-5 PM window
- Keep suggestions within 3 days of requested date

INFORMATION QUERIES:
- For service details, use get_clinic_information function
- Provide pricing, duration, and locations for treatments
- Explain procedures clearly and professionally`;

const FUNCTION_DEFINITIONS = [
  {
    type: 'function',
    name: 'check_appointment_availability',
    description: 'Check if a specific appointment slot is available at Just Ears Clinic. Returns availability status and conflict details if unavailable. Use this before creating appointments.',
    parameters: {
      type: 'object',
      properties: {
        appointment_type: {
          type: 'string',
          description: "Type of appointment: 'Microsuction', 'Hearing Test', 'Custom Ear Plugs', 'New Patient Consultation', 'Follow-up'"
        },
        date: {
          type: 'string',
          description: 'Appointment date in YYYY-MM-DD format. Must be a weekday (Monday-Friday).'
        },
        time: {
          type: 'string',
          description: 'Appointment time in HH:MM format (24-hour). Must be between 09:00-17:00.'
        },
        duration_minutes: {
          type: 'number',
          description: 'Duration in minutes. Common durations: Microsuction=45, Hearing Test=60, New Patient=45, Follow-up=30'
        },
        location: {
          type: 'string',
          description: "Clinic location name (e.g., 'Winchester', 'Portsmouth', 'Chichester')"
        }
      },
      required: ['appointment_type', 'date', 'time', 'duration_minutes', 'location']
    }
  },
  {
    type: 'function',
    name: 'create_appointment',
    description: 'Create a confirmed appointment in the calendar. Only call this after checking availability and collecting all patient information.',
    parameters: {
      type: 'object',
      properties: {
        patient_name: {
          type: 'string',
          description: "Patient's full name"
        },
        phone: {
          type: 'string',
          description: "Patient's contact phone number"
        },
        appointment_type: {
          type: 'string',
          description: 'Type of appointment'
        },
        start_datetime: {
          type: 'string',
          description: "Start date and time in ISO 8601 format (e.g., '2025-09-30T14:00:00Z')"
        },
        end_datetime: {
          type: 'string',
          description: 'End date and time in ISO 8601 format'
        },
        location: {
          type: 'string',
          description: 'Clinic location name'
        },
        notes: {
          type: 'string',
          description: 'Appointment notes including symptoms, medications, and accessibility needs'
        }
      },
      required: ['patient_name', 'phone', 'appointment_type', 'start_datetime', 'end_datetime', 'location']
    }
  },
  {
    type: 'function',
    name: 'get_clinic_information',
    description: 'Retrieve information about Just Ears Clinic services, procedures, locations, or pricing from the website.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ['microsuction', 'hearing-tests', 'custom-ear-plugs', 'locations', 'services'],
          description: 'The information topic to retrieve'
        }
      },
      required: ['topic']
    }
  }
];

export function handleConnection(twilioWs: WebSocket) {
  let openaiWs: WebSocket | null = null;
  let streamSid: string | null = null;
  let responseInProgress = false;

  // Connect to OpenAI Realtime API
  openaiWs = new WebSocket(config.openai.realtimeUrl, {
    headers: {
      'Authorization': `Bearer ${config.openai.apiKey}`,
      'OpenAI-Beta': 'realtime=v1'
    }
  });

  openaiWs.on('open', () => {
    console.log('Connected to OpenAI Realtime API');
    
    // Configure session
    const sessionUpdate = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: SYSTEM_MESSAGE,
        voice: 'alloy',
        input_audio_format: 'g711_ulaw',
        output_audio_format: 'g711_ulaw',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: FUNCTION_DEFINITIONS,
        tool_choice: 'auto',
        temperature: 0.7
      }
    };
    
    openaiWs!.send(JSON.stringify(sessionUpdate));
    console.log('Session configured');
  });

  openaiWs.on('message', async (data: WebSocket.Data) => {
    try {
      const response = JSON.parse(data.toString());
      
      // Handle different response types
      switch (response.type) {
        case 'session.created':
          console.log('Session created:', response.session.id);
          break;

        case 'session.updated':
          console.log('Session updated successfully');
          break;

        case 'input_audio_buffer.speech_started':
          console.log('User started speaking');
          responseInProgress = false;
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('User stopped speaking');
          break;

        case 'response.done':
          console.log('Response completed');
          responseInProgress = false;
          break;

        case 'response.audio.delta':
          // Send audio back to Twilio
          if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
            const audioPayload = {
              event: 'media',
              streamSid: streamSid,
              media: {
                payload: response.delta
              }
            };
            twilioWs.send(JSON.stringify(audioPayload));
          }
          break;

        case 'response.function_call_arguments.done':
          console.log('Function call:', response.name);
          
          // Execute function call
          const result = await executeFunctionCall(
            response.name,
            JSON.parse(response.arguments)
          );
          
          // Send result back to OpenAI
          const functionOutput = {
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: response.call_id,
              output: JSON.stringify(result)
            }
          };
          openaiWs!.send(JSON.stringify(functionOutput));
          
          // Request response generation with the function result
          openaiWs!.send(JSON.stringify({ type: 'response.create' }));
          responseInProgress = true;
          break;

        case 'error':
          console.error('OpenAI error:', response.error);
          break;

        default:
          // Log other event types for debugging
          if (response.type !== 'response.audio.delta') {
            console.log('OpenAI event:', response.type);
          }
      }
    } catch (error) {
      console.error('Error processing OpenAI message:', error);
    }
  });

  openaiWs.on('error', (error) => {
    console.error('OpenAI WebSocket error:', error);
  });

  openaiWs.on('close', () => {
    console.log('Disconnected from OpenAI Realtime API');
  });

  // Handle Twilio messages
  twilioWs.on('message', (message: WebSocket.Data) => {
    try {
      const msg = JSON.parse(message.toString());

      switch (msg.event) {
        case 'start':
          streamSid = msg.start.streamSid;
          console.log('Twilio stream started:', streamSid);
          break;

        case 'media':
          // Forward audio to OpenAI
          // Server-side VAD (configured in session) will automatically:
          // 1. Detect speech start/stop
          // 2. Commit audio buffer when user stops speaking
          // 3. Process and generate response
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            const audioAppend = {
              type: 'input_audio_buffer.append',
              audio: msg.media.payload
            };
            openaiWs.send(JSON.stringify(audioAppend));
          }
          break;

        case 'stop':
          console.log('Twilio stream stopped');
          if (openaiWs) {
            openaiWs.close();
          }
          break;
      }
    } catch (error) {
      console.error('Error processing Twilio message:', error);
    }
  });

  twilioWs.on('close', () => {
    console.log('Twilio WebSocket closed');
    if (openaiWs) {
      openaiWs.close();
    }
  });

  twilioWs.on('error', (error) => {
    console.error('Twilio WebSocket error:', error);
  });
}
