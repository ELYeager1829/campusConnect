// 1) Replace these with YOUR EmailJS values
const EMAILJS_PUBLIC_KEY = "SsG7CgyKmOwvUtTFA";
const EMAILJS_SERVICE_ID = "service_j0wg7ad";
const EMAILJS_TEMPLATE_ID = "template_1n5212g";

// 2) Initialize EmailJS
if (window.emailjs) {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

// 3) Helper to send an email
async function sendNotificationEmail({ to_email, to_name, subject, type,
  request_id,
  description,
  status }) {
  // Keep it here so app logic stays the same.
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email,
    to_name,
    subject,
    type,
    request_id,
    description,
    status
  });
}
