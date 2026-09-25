// ==========================================================
// EMAILJS CONFIG — fill this in with YOUR EmailJS account values
// ==========================================================
// How to get these (see the setup steps you were given):
// 1. Sign up free at https://www.emailjs.com
// 2. Email Services → Add New Service → connect Gmail (or any email) → copy the Service ID
// 3. Email Templates → create one for OTP codes (uses {{to_name}}, {{to_email}}, {{otp_code}})
//    → copy its Template ID
// 4. Email Templates → create another for approval emails (uses {{to_name}}, {{to_email}}, {{login_url}})
//    → copy its Template ID
// 5. Account → General → copy your Public Key
// IMPORTANT: in BOTH templates, set the "To Email" field to {{to_email}} —
// otherwise EmailJS won't know who to send to.
// ==========================================================

export const emailjsConfig = {
  publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
  serviceId: "YOUR_EMAILJS_SERVICE_ID",
  otpTemplateId: "YOUR_OTP_TEMPLATE_ID",
  approvalTemplateId: "template_ixu86tv",

  // Shown to users inside the approval email as the login link.
  // Change this to your real site URL once you know it.
  loginUrl: "https://your-site-url-here.com/login.html"
};
