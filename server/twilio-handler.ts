import type { Request, Response } from "express";
// @ts-ignore - twilio types are not perfectly aligned
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export function handleIncomingCall(req: Request, res: Response) {
  console.log("Incoming call received");

  const response = new VoiceResponse();

  // Connect to media stream
  const connect = response.connect();
  connect.stream({
    url: `wss://${req.headers.host}/media-stream`,
  });

  res.type("text/xml");
  res.send(response.toString());
}

export function handleMediaStream(req: Request, res: Response) {
  console.log("Media stream webhook hit");
  res.sendStatus(200);
}

export function createTwiMlTransfer(phone_number: string) {
  console.log("Transfer function called");

  const response = new VoiceResponse();
  const dial = response.dial({
    answerOnBridge: true, // only connect when the other party answers.
  });

  dial.number(phone_number);

  // send back the new TwinML
  return response.toString();
}
