import axios from "axios";
import { config } from "./config";
import { Json } from "twilio/lib/interfaces";

interface CheckAvailabilityParams {
  appointment_type: string;
  date: string;
  time: string;
  duration_minutes: number;
  location: string;
}

interface CreateAppointmentParams {
  patient_name: string;
  phone: string;
  appointment_type: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  notes?: string;
}

interface GetClinicInfoParams {
  topic: string;
  clinic_name?: string;
}

export async function executeFunctionCall(functionName: string, args: any) {
  console.log(`Executing function: ${functionName}`, args);

  try {
    switch (functionName) {
      case "check_appointment_availability":
        return await checkAvailability(args);

      case "create_appointment":
        return await createAppointment(args);

      case "get_clinic_information":
        return await getClinicInfo(args);

      case "transfer_to_receptionist":
        return await transferToReceptionist(args);

      default:
        return { error: `Unknown function: ${functionName}` };
    }
  } catch (error: any) {
    console.error(`Error executing ${functionName}:`, error.message);
    return { error: error.message };
  }
}

async function checkAvailability(params: CheckAvailabilityParams) {
  const url = `${config.n8n.baseUrl}/voice-assistant`;

  const payload = {
    action: "check_availability",
    appointment_type: params.appointment_type,
    date: params.date,
    time: params.time,
    duration_minutes: params.duration_minutes,
    location: params.location,
  };

  console.log(
    "sending payload to n8n: ",
    payload,
    "url: ",
    url,
    "config: ",
    config.n8n.baseUrl,
    process.env.N8N_WEBHOOK_BASE_URL,
  );

  const response = await axios.post(url, payload);
  return response.data;
}

async function createAppointment(params: CreateAppointmentParams) {
  const url = `${config.n8n.baseUrl}/voice-assistant`;

  const payload = {
    action: "create_appointment",
    patient_name: params.patient_name,
    phone: params.phone,
    appointment_type: params.appointment_type,
    start_datetime: params.start_datetime,
    end_datetime: params.end_datetime,
    location: params.location,
    notes: params.notes || "",
  };

  const response = await axios.post(url, payload);
  return response.data;
}

async function getClinicInfo(params: GetClinicInfoParams) {
  const url = `${config.n8n.baseUrl}/voice-assistant`;

  const payload: {action: string, topic: string, clinic_name?: string} = {
    action: "get_info",
    topic: params.topic,
  };

  if (params.hasOwnProperty('clinic_name')) {
    payload.clinic_name = params.clinic_name;
  }

  const response = await axios.post(url, payload);
  return response.data;
}

async function transferToReceptionist(params: { reason: string }) {
  return {
    action: "transfer",
    phone_number: config.transfer.number,
    reason: params.reason,
  };
}
