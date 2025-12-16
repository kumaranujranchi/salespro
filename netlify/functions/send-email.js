const nodemailer = require('nodemailer');

// Base URL for logo (adjust based on your deployment)
const LOGO_URL = 'https://raw.githubusercontent.com/yourusername/salesPro/main/public/logo.png'; // Update this

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { type, email, name, data } = JSON.parse(event.body);

    if (!email || !type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email or type' }),
      };
    }

    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let subject = '';
    let htmlContent = '';

    // Common email header with branding
    const emailHeader = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 20px 20px 0 0;">
        <div style="background: white; width: 120px; height: 120px; margin: 0 auto 20px; border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="#667eea"/>
            <path d="M 30 50 L 45 65 L 70 35" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <text x="50" y="90" font-family="Arial, sans-serif" font-size="14" fill="#667eea" text-anchor="middle" font-weight="bold">SalesPro</text>
          </svg>
        </div>
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">SalesPro</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px; letter-spacing: 1px;">Your Sales Management Platform</p>
      </div>
    `;

    const emailFooter = `
      <div style="background: #f8f9fa; padding: 30px 20px; text-align: center; border-radius: 0 0 20px 20px; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Need help? Contact our support team</p>
        <a href="mailto:support@salespro.com" style="color: #667eea; text-decoration: none; font-weight: 600;">support@salespro.com</a>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 SalesPro. All rights reserved.</p>
        </div>
      </div>
    `;

    const containerStart = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
        ${emailHeader}
        <div style="padding: 40px 30px;">
    `;

    const containerEnd = `
        </div>
        ${emailFooter}
      </div>
    `;

    // --- TEMPLATE LOGIC ---
    if (type === 'OTP') {
      subject = '🔐 Verify Your Email Address - SalesPro';
      htmlContent = `
        ${containerStart}
          <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0; text-align: center;">Welcome to SalesPro! 🎉</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi <strong>${name || 'User'}</strong>,</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Thank you for joining SalesPro! To complete your registration, please verify your email address using the code below:</p>
          
          <div style="text-align: center; margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 15px; border: 2px dashed #667eea;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your Verification Code</p>
            <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #667eea; font-family: 'Courier New', monospace; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">${data.otp}</div>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px; display: flex; align-items: center;">
              <span style="font-size: 20px; margin-right: 10px;">⏰</span>
              <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">If you didn't request this code, please ignore this email.</p>
        ${containerEnd}
      `;
    } 
    else if (type === 'TICKET_CREATED') {
      subject = `✅ [Ticket #${data.ticketNumber}] Support Request Received`;
      htmlContent = `
        ${containerStart}
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; border-radius: 50px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
              ✅ Request Received
            </div>
          </div>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">Hi <strong>${name || 'Valued Customer'}</strong>,</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Thank you for reaching out to us! We have successfully received your support request and our team is reviewing it.</p>
          
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 15px; border: 2px solid #10b981; margin: 25px 0;">
            <h3 style="color: #047857; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
              <span style="font-size: 24px; margin-right: 10px;">🎫</span> Ticket Details
            </h3>
            <div style="background: white; padding: 15px; border-radius: 10px; margin-top: 15px;">
              <p style="margin: 0 0 10px 0; color: #374151;"><strong style="color: #047857;">Subject:</strong> ${data.subject}</p>
              <p style="margin: 0; color: #374151;"><strong style="color: #047857;">Ticket ID:</strong> <span style="font-family: 'Courier New', monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-weight: 600;">#${data.ticketNumber}</span></p>
            </div>
          </div>

          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; border-radius: 8px; margin: 25px 0;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              <strong>💡 What's Next?</strong><br/>
              Our support team will review your request and get back to you as soon as possible. You'll receive another email once your ticket is resolved.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">Thank you for your patience!</p>
        ${containerEnd}
      `;
    }
    else if (type === 'TICKET_RESOLVED') {
      subject = `🎉 [Ticket #${data.ticketNumber}] Your Issue Has Been Resolved`;
      htmlContent = `
        ${containerStart}
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; border-radius: 50px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
              🎉 Issue Resolved
            </div>
          </div>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">Hi <strong>${name || 'Valued Customer'}</strong>,</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Great news! 🎊 Your support ticket has been successfully resolved by our team.</p>
          
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 15px; border: 2px solid #10b981; margin: 25px 0; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);">
            <h3 style="color: #047857; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
              <span style="font-size: 24px; margin-right: 10px;">🎫</span> Resolution Details
            </h3>
            <div style="background: white; padding: 20px; border-radius: 10px; margin-top: 15px;">
              <p style="margin: 0 0 15px 0; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; color: #374151;">
                <strong style="color: #047857;">Ticket ID:</strong> 
                <span style="font-family: 'Courier New', monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-weight: 600; margin-left: 5px;">#${data.ticketNumber}</span>
              </p>
              <p style="margin: 0; color: #374151; line-height: 1.6;">
                <strong style="color: #047857; display: block; margin-bottom: 8px;">Resolution:</strong>
                <span style="display: block; background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 3px solid #10b981;">${data.resolution}</span>
              </p>
            </div>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 8px; margin: 25px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>📌 Still need help?</strong><br/>
              If you have any further questions or concerns, feel free to raise a new support ticket or contact us directly.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #4b5563; font-size: 16px; margin: 0 0 20px 0;">We value your feedback!</p>
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 50px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); transition: all 0.3s;">
              Rate Our Support
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">Thank you for choosing SalesPro! 💙</p>
        ${containerEnd}
      `;
    }
    else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email type' }) };
    }

    const mailOptions = {
      from: `"SalesPro Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send email', 
        details: error.message 
      }),
    };
  }
};
