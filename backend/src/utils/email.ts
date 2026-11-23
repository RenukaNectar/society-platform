import nodemailer from 'nodemailer';
import { IEmailOptions } from '@/types';
import logger from './logger';

const stripEnvQuotes = (value?: string): string | undefined => {
  if (value == null) return value;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

export const isMailEnabled = (): boolean => process.env['IS_MAIL_ENABLED'] === 'true';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env['MAIL_HOST'] || process.env['SMTP_HOST'],
    port: parseInt(process.env['MAIL_PORT'] || process.env['SMTP_PORT'] || '587'),
    secure: process.env['MAIL_ENCRYPTION'] === 'ssl' || process.env['SMTP_PORT'] === '465', // true for 465, false for other ports
    auth: {
      user: stripEnvQuotes(process.env['MAIL_USERNAME'] || process.env['SMTP_USER']),
      pass: stripEnvQuotes(process.env['MAIL_PASSWORD'] || process.env['SMTP_PASS']),
    },
  });
};

// Send email function
export const sendEmail = async (options: IEmailOptions): Promise<void> => {
  if (!isMailEnabled()) {
    logger.warn('Mail is disabled (IS_MAIL_ENABLED!=true); skipping send', { to: options.to, subject: options.subject });
    return;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: options.from || process.env['MAIL_FROM_ADDRESS'] || process.env['SMTP_USER'],
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { messageId: info.messageId });
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
};

/** Attempt OTP email; returns false if mail is disabled or SMTP fails (does not throw). */
export const trySendOTPEmail = async (
  email: string,
  otp: string,
  firstName?: string
): Promise<boolean> => {
  if (!isMailEnabled()) {
    logger.warn('Mail is disabled; skipping OTP email', { email });
    return false;
  }
  try {
    await sendOTPEmail(email, otp, firstName);
    return true;
  } catch (error) {
    logger.error('OTP email could not be sent:', error);
    return false;
  }
};

// Send verification email
export const sendVerificationEmail = async (email: string, userId: string): Promise<void> => {
  const verificationToken = generateVerificationToken(userId);
  const verificationUrl = `${process.env['FRONTEND_URL']}/verify-email?token=${verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Email Verification</h2>
      <p>Hello,</p>
      <p>Thank you for registering with our Society Management System. Please click the button below to verify your email address:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>Society Management Team</p>
    </div>
  `;

  const text = `
    Email Verification
    
    Hello,
    
    Thank you for registering with our Society Management System. Please click the link below to verify your email address:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    Best regards,
    Society Management Team
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email Address',
    html,
    text,
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env['FRONTEND_URL']}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>You have requested to reset your password. Please click the button below to create a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      </div>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>Best regards,<br>Society Management Team</p>
    </div>
  `;

  const text = `
    Password Reset Request
    
    Hello,
    
    You have requested to reset your password. Please click the link below to create a new password:
    
    ${resetUrl}
    
    If you didn't request this password reset, please ignore this email.
    
    This link will expire in 1 hour.
    
    Best regards,
    Society Management Team
  `;

  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html,
    text,
  });
};

// Send welcome email
export const sendWelcomeEmail = async (email: string, firstName: string): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Society Management System</h2>
      <p>Hello ${firstName},</p>
      <p>Welcome to our Society Management System! Your account has been successfully created.</p>
      <p>You can now login to your account to access your dashboard.</p>
      <a href="${process.env['API_URL']}/login" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Login</a>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>Society Management Team</p>
    </div>
  `;

  const text = `
    Welcome to Society Management System
    
    Hello ${firstName},
    
    Welcome to our Society Management System! Your account has been successfully created and verified.
    
    You can now:
    - Access your dashboard
    - Update your profile
    - Participate in society activities
    - Connect with other members
    
    If you have any questions, please don't hesitate to contact our support team.
    
    Best regards,
    Society Management Team
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to Society Management System',
    html,
    text,
  });
};

// Send OTP email
export const sendOTPEmail = async (email: string, otp: string, firstName?: string): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">OTP Verification</h2>
      <p>Hello ${firstName || 'there'},</p>
      <p>You have requested to verify your email. Please use the following OTP to complete the process:</p>
      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; display: inline-block;">
          <h1 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</h1>
        </div>
      </div>
      <p><strong>Important:</strong></p>
      <ul>
        <li>This OTP is valid for 5 minutes only</li>
        <li>Do not share this OTP with anyone</li>
        <li>If you didn't request this email verification, please ignore this email</li>
        <li>For testing: OTP is fixed as 1234</li>
      </ul>
      <p>Best regards,<br>Society Management Team</p>
    </div>
  `;

  const text = `
    OTP Verification
    
    Hello ${firstName || 'there'},
    
    You have requested to verify your email. Please use the following OTP to complete the process:
    
    ${otp}
    
    Important:
    - This OTP is valid for 5 minutes only
    - Do not share this OTP with anyone
    - If you didn't request this email verification, please ignore this email
    - For testing: OTP is fixed as 1234
    
    Best regards,
    Society Management Team
  `;

  await sendEmail({
    to: email,
    subject: 'OTP Verification',
    html,
    text,
  });
};

// Send BOD (Board of Directors) verification OTP
export const sendBodOtpEmail = async (email: string, otp: string, memberName?: string): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">BOD Verification OTP</h2>
      <p>Hello ${memberName || 'there'},</p>
      <p>Please use the following OTP to verify your Board of Directors action:</p>
      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; display: inline-block;">
          <h1 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</h1>
        </div>
      </div>
      <p><strong>Important:</strong> This OTP is valid for 5 minutes only. Do not share with anyone.</p>
      <p>Best regards,<br>Society Management Team</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'BOD Verification OTP',
    html,
    text: `Your BOD verification OTP is: ${otp}. Valid for 5 minutes.`,
  });
};

// Send notification email
export const sendNotificationEmail = async (
  email: string,
  subject: string,
  message: string,
  actionUrl?: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${subject}</h2>
      <p>${message}</p>
      ${actionUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env['API_URL']}${actionUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a>
        </div>
      ` : ''}
      <p>Best regards,<br>Society Management Team</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text: message,
  });
};

// Generate verification token (in a real app, this would be stored in database)
const generateVerificationToken = (userId: string): string => {
  // This is a simple implementation
  // In production, you should use a proper token generation library
  return Buffer.from(`${userId}-${Date.now()}`).toString('base64');
};

// Test email configuration
export const testEmailConfiguration = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email configuration is valid');
    return true;
  } catch (error) {
    logger.error('Email configuration is invalid:', error);
    return false;
  }
};


// Send notification email to multiple users
export const sendNotificationEmailToMultipleUsers = async (emails: string[], subject: string, message: string, actionUrl?: string): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${subject}</h2>
      <p>${message}</p>
      ${actionUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env['API_URL']}${actionUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a>
        </div>
      ` : ''}
      <p>Best regards,<br>Society Management Team</p>
    </div>
  `;

  await sendEmail({
    to: emails.join(','),
    subject,
    html,
    text: message,
  });
};