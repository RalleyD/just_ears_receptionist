import type { Request, Response } from "express";
import { config } from "./config";
// @ts-ignore - twilio types are not perfectly aligned
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export function handleIncomingCall(req: Request, res: Response) {
  console.log("Incoming call received");

  const response = new VoiceResponse();

  // Connect to media stream
  const connect = response.connect();
  let stream = connect.stream({
    url: `wss://${req.headers.host}/media-stream`,
  });
  /* 
    utilise Twilio's stream custom parameters to pass
    the callerID to the websocket stream, as TwiML.
  */
  stream.parameter({
      name: "caller_id",
      value: req.body.From || ""
  })

  res.type("text/xml");
  res.send(response.toString());
}

export function handleMediaStream(req: Request, res: Response) {
  console.log("Media stream webhook hit");
  res.sendStatus(200);
}

export function createTwiMlTransfer(phone_number: string, caller_number?: string) {
  console.log("Transfer function called");

  // check the number exists and is valid i.e E.164 format.
  // wrap in Boolean, in case caller number is 'undefined', prevents returning 'undefined' type.
  let call_number_valid: boolean = Boolean(caller_number && caller_number.startsWith("+"));

  const response = new VoiceResponse();
  const dial = response.dial({
    answerOnBridge: true, // only connect when the other party answers.
    callerId: call_number_valid ? caller_number : config.twilio.number!,
  });

  dial.number(phone_number);

  // send back the new TwinML
  return response.toString();
}
