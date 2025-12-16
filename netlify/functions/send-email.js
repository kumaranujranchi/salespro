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

    console.log('Email function called with:', { type, email, name });

    if (!email || !type) {
      console.error('Missing required fields:', { email, type });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email or type' }),
      };
    }

    // Check email credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email service not configured. Please contact administrator.' }),
      };
    }

    console.log('Creating email transporter...');
    
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

    // Common email header with branding - Email-client compatible design
    const emailHeader = `
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%); padding: 50px 20px; text-align: center; border-radius: 0; position: relative; overflow: hidden;">
        <!-- Decorative circles -->
        <div style="position: absolute; top: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        <div style="position: absolute; bottom: -40px; right: -40px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        <div style="position: absolute; top: 50%; right: 10%; width: 60px; height: 60px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
        
        <!-- Logo Badge with Emoji -->
        <div style="position: relative; z-index: 1;">
          <div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); width: 140px; height: 140px; margin: 0 auto 25px; border-radius: 30px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 8px rgba(255,255,255,0.2); transform: rotate(-5deg); transition: transform 0.3s;">
            <div style="text-align: center;">
              <div style="font-size: 50px; line-height: 1; margin-bottom: 5px; transform: rotate(5deg);">📊</div>
              <div style="font-size: 18px; font-weight: 900; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -0.5px; transform: rotate(5deg);">SalesPro</div>
            </div>
          </div>
          
          <!-- Main Title -->
          <h1 style="color: #ffffff; margin: 0 0 15px 0; font-size: 42px; font-weight: 900; text-shadow: 0 4px 20px rgba(0,0,0,0.3); letter-spacing: -1px; line-height: 1;">
            Sales<span style="color: #fbbf24;">Pro</span>
          </h1>
          
          <!-- Subtitle with icon -->
          <div style="display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 10px 25px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.3);">
            <p style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">
              ⚡ Your Sales Management Platform
            </p>
          </div>
        </div>
      </div>
    `;

    const emailFooter = `
      <div style="background: linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%); padding: 40px 30px; text-align: center; border-top: 3px solid #e5e7eb;">
        <!-- Support Section -->
        <div style="margin-bottom: 25px;">
          <p style="color: #6b7280; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">Need assistance? We're here to help! 💬</p>
          <a href="mailto:support@salespro.com" style="display: inline-block; color: #6366f1; text-decoration: none; font-weight: 700; font-size: 16px; padding: 12px 30px; background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 50px; border: 2px solid #6366f1; transition: all 0.3s;">
            📧 support@salespro.com
          </a>
        </div>
        
        <!-- Divider -->
        <div style="height: 2px; background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%); margin: 30px 0;"></div>
        
        <!-- Social Links -->
        <div style="margin: 25px 0;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0 0 15px 0;">Follow us on social media</p>
          <div style="display: inline-block;">
            <a href="#" style="display: inline-block; margin: 0 8px; text-decoration: none; font-size: 24px;">📘</a>
            <a href="#" style="display: inline-block; margin: 0 8px; text-decoration: none; font-size: 24px;">🐦</a>
            <a href="#" style="display: inline-block; margin: 0 8px; text-decoration: none; font-size: 24px;">💼</a>
            <a href="#" style="display: inline-block; margin: 0 8px; text-decoration: none; font-size: 24px;">📸</a>
          </div>
        </div>
        
        <!-- Copyright -->
        <div style="margin-top: 25px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.6;">
            © 2024 <strong style="color: #6366f1;">SalesPro</strong>. All rights reserved.<br/>
            <span style="font-size: 11px;">Made with ❤️ for modern sales teams</span>
          </p>
        </div>
      </div>
    `;

    const containerStart = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 0; overflow: hidden; box-shadow: 0 0 0 1px rgba(0,0,0,0.05);">
        ${emailHeader}
        <div style="padding: 45px 35px; background: #ffffff;">
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

    console.log('Sending email to:', email, 'with subject:', subject);

    await transporter.sendMail(mailOptions);

    console.log('Email sent successfully to:', email);

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
