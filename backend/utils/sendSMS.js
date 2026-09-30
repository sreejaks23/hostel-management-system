import twilio from "twilio";

let client;

const getClient = () => {
  if (!client && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
};

// Sends an SMS. Fails silently (logs only) if Twilio isn't configured.
const sendSMS = async ({ to, body }) => {
  try {
    const c = getClient();
    if (!c || !process.env.TWILIO_PHONE_NUMBER) {
      console.log(`[sms:skipped-no-config] to=${to} body=${body}`);
      return { skipped: true };
    }
    const message = await c.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return message;
  } catch (error) {
    console.error("sendSMS error:", error.message);
    return { error: error.message };
  }
};

export default sendSMS;
