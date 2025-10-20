const axios = require('axios');
const config = require('./config');

async function executeFunctionCall(functionName, args) {
  console.log(`Executing function: ${functionName}`, args);

  try {
    switch (functionName) {
      case 'check_appointment_availability':
        return await checkAvailability(args);
      
      case 'create_appointment':
        return await createAppointment(args);
      
      case 'get_clinic_information':
        return await getClinicInfo(args);
      
      default:
        return { error: `Unknown function: ${functionName}` };
    }
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error.message);
    return { error: error.message };
  }
}

async function checkAvailability(params) {
  const url = `${config.n8n.baseUrl}/voice-assistant`;
  
  const payload = {
    action: 'check_availability',
    appointment_type: params.appointment_type,
    date: params.date,
    time: params.time,
    duration_minutes: params.duration_minutes,
    location: params.location
  };

  const response = await axios.post(url, payload);
  return response.data;
}

async function createAppointment(params) {
  const url = `${config.n8n.baseUrl}/voice-assistant`;
  
  const payload = {
    action: 'create_appointment',
    patient_name: params.patient_name,
    phone: params.phone,
    appointment_type: params.appointment_type,
    start_datetime: params.start_datetime,
    end_datetime: params.end_datetime,
    location: params.location,
    notes: params.notes || ''
  };

  const response = await axios.post(url, payload);
  return response.data;
}

async function getClinicInfo(params) {
  const url = `${config.n8n.baseUrl}/voice-assistant`;
  
  const payload = {
    action: 'get_info',
    topic: params.topic
  };

  const response = await axios.post(url, payload);
  return response.data;
}

module.exports = {
  executeFunctionCall
};
