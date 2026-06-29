import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || '';
const port = parseInt(process.env.SMTP_PORT || '2525', 10);
const user = process.env.SMTP_USER || '';
const pass = process.env.SMTP_PASS || '';
const from = process.env.SMTP_FROM || 'no-reply@personalizedgiftstore.com';

const transporter = nodemailer.createTransport({
  host: host || 'smtp.mailtrap.io',
  port: port,
  auth: {
    user: user,
    pass: pass,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    // Fallback if SMTP config is missing/incomplete
    if (!host || !user || !pass) {
      console.log(`\n============== MOCK EMAIL NOTIFICATION ==============`);
      console.log(`TO:      ${to}`);
      console.log(`FROM:    ${from}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY:`);
      console.log(html.replace(/<[^>]*>/g, ' ')); // strip html tags for preview
      console.log(`=====================================================\n`);
      return;
    }

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to} for action: ${subject}`);
  } catch (error) {
    console.error('Nodemailer send failed, falling back to console logging:', error);
    console.log(`\n============== EMAIL SEND FAILURE FALLBACK ==============`);
    console.log(`TO:      ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`=========================================================\n`);
  }
};

export const sendRequestSubmittedEmail = async (email: string, name: string, requestId: string, orderNumber: string) => {
  const subject = `Return/Replacement Request Submitted - ${orderNumber}`;
  const html = `
    <h2>Hello ${name},</h2>
    <p>Your return/replacement request has been successfully submitted.</p>
    <p><strong>Order Number:</strong> ${orderNumber}</p>
    <p><strong>Request ID:</strong> ${requestId}</p>
    <p>We are reviewing your request and will update you shortly.</p>
    <br/>
    <p>Best regards,</p>
    <p>Personalized Gift Store Support Team</p>
  `;
  await sendEmail(email, subject, html);
};

export const sendRequestStatusUpdatedEmail = async (email: string, name: string, requestId: string, newStatus: string, note?: string) => {
  const subject = `Return Request Status Update - ${requestId}`;
  const html = `
    <h2>Hello ${name},</h2>
    <p>The status of your return request (ID: ${requestId}) has been updated.</p>
    <p><strong>New Status:</strong> ${newStatus.replace('_', ' ')}</p>
    ${note ? `<p><strong>Update Note:</strong> ${note}</p>` : ''}
    <p>Log in to your account dashboard to track details.</p>
    <br/>
    <p>Best regards,</p>
    <p>Personalized Gift Store Support Team</p>
  `;
  await sendEmail(email, subject, html);
};

export const sendPasswordResetEmail = async (email: string, name: string, resetUrl: string) => {
  const subject = `Password Reset Request`;
  const html = `
    <h2>Hello ${name},</h2>
    <p>You requested a password reset. Please click the link below to set a new password. The link is valid for 1 hour.</p>
    <p><a href="${resetUrl}" target="_blank">Reset Password Link</a></p>
    <p>If you did not make this request, please ignore this email.</p>
    <br/>
    <p>Best regards,</p>
    <p>Personalized Gift Store Team</p>
  `;
  await sendEmail(email, subject, html);
};
