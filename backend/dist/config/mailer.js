"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendRequestStatusUpdatedEmail = exports.sendRequestSubmittedEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const host = process.env.SMTP_HOST || '';
const port = parseInt(process.env.SMTP_PORT || '2525', 10);
const user = process.env.SMTP_USER || '';
const pass = process.env.SMTP_PASS || '';
const from = process.env.SMTP_FROM || 'no-reply@personalizedgiftstore.com';
const transporter = nodemailer_1.default.createTransport({
    host: host || 'smtp.mailtrap.io',
    port: port,
    auth: {
        user: user,
        pass: pass,
    },
});
const sendEmail = async (to, subject, html) => {
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
    }
    catch (error) {
        console.error('Nodemailer send failed, falling back to console logging:', error);
        console.log(`\n============== EMAIL SEND FAILURE FALLBACK ==============`);
        console.log(`TO:      ${to}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`=========================================================\n`);
    }
};
exports.sendEmail = sendEmail;
const sendRequestSubmittedEmail = async (email, name, requestId, orderNumber) => {
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
    await (0, exports.sendEmail)(email, subject, html);
};
exports.sendRequestSubmittedEmail = sendRequestSubmittedEmail;
const sendRequestStatusUpdatedEmail = async (email, name, requestId, newStatus, note) => {
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
    await (0, exports.sendEmail)(email, subject, html);
};
exports.sendRequestStatusUpdatedEmail = sendRequestStatusUpdatedEmail;
const sendPasswordResetEmail = async (email, name, resetUrl) => {
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
    await (0, exports.sendEmail)(email, subject, html);
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
