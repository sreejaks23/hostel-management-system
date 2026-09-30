import Notification from "../models/Notification.js";
import sendEmail from "./sendEmail.js";
import sendSMS from "./sendSMS.js";

// Central notification dispatcher: creates an in-app Notification record
// and optionally sends email/SMS based on requested channels.
const notify = async ({ user, title, message, type = "general", channel = ["in_app"], link = "" }) => {
  const notification = await Notification.create({
    recipient: user._id,
    title,
    message,
    type,
    channel,
    link,
  });

  if (channel.includes("email") && user.email) {
    await sendEmail({ to: user.email, subject: title, text: message, html: `<p>${message}</p>` });
  }
  if (channel.includes("sms") && user.phone) {
    await sendSMS({ to: user.phone, body: `${title}: ${message}` });
  }

  return notification;
};

export default notify;
