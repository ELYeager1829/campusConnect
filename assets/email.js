// 1) Replace these with YOUR EmailJS values
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";

// 2) Initialize EmailJS
if (window.emailjs) {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

// 3) Helper to send an email
async function sendNotificationEmail({ to_email, to_name, subject, message }) {
  // If you haven't configured EmailJS yet, this will fail.
  // Keep it here so your app logic stays the same.
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email,
    to_name,
    subject,
    message
  });
}
