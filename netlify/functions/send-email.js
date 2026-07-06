const nodemailer = require('nodemailer');

// Brand logo URL - Use DarkLogo for light email background
const BASE_URL = process.env.URL || 'https://realsalepro.com';
const LOGO_URL = `${BASE_URL}/images/RealSalePro_DarkLogo.png`;

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
    
    // Create a transporter using SMTP (Hostinger / Custom SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.EMAIL_PORT || '465', 10),
      secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let subject = '';
    let htmlContent = '';

    // Common email wrapper - Clean and Simple Design
    const emailWrapper = (content) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <!-- Main Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
                
                <!-- Logo Section -->
                <tr>
                  <td align="center" style="padding: 40px 40px 20px 40px;">
                    <img src="${LOGO_URL}" alt="RealSalePro Logo" style="width: 180px; height: auto; display: block;">
                  </td>
                </tr>

                <!-- Content Section -->
                <tr>
                  <td style="padding: 20px 50px 50px 50px;">
                    ${content}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 30px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 13px;">
                      Have a question?
                    </p>
                    <p style="margin: 0 0 15px 0;">
                      <a href="mailto:support@realsalepro.com" style="color: #4F46E5; text-decoration: none; font-weight: 600;">support@realsalepro.com</a>
                    </p>
                    <p style="margin: 15px 0 0 0; color: #999999; font-size: 12px;">
                      This is an automatically generated email<br>
                      Replies to this email address are not monitored
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // --- TEMPLATE LOGIC ---
    if (type === 'OTP') {
      subject = 'Verification Code - SalesPro';
      const content = `
        <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">
          Verification Code
        </h2>
        <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6; text-align: center;">
          To verify your account, enter the code in RealSalePro
        </p>
        
        <!-- OTP Box -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 30px 0;">
              <div style="background-color: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px 40px; display: inline-block;">
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; font-family: 'Courier New', monospace;">
                  ${data.otp}
                </div>
              </div>
            </td>
          </tr>
        </table>

        <p style="margin: 30px 0 10px 0; color: #666666; font-size: 13px; line-height: 1.6; text-align: center;">
          Verification codes expire after 48 hours
        </p>
        <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6; text-align: center;">
          If you did not request this code, you can ignore this message
        </p>
      `;
      htmlContent = emailWrapper(content);
    }
    else if (type === 'TICKET_CREATED') {
      subject = `Support Request Received - Ticket #${data.ticketNumber}`;
      const content = `
        <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">
          Support Request Received
        </h2>
        <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6; text-align: center;">
          Thank you for contacting us. We have received your support request.
        </p>
        
        <!-- Ticket Details Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="background-color: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 8px; padding: 25px;">
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr>
                  <td style="color: #666666; font-size: 14px; padding-bottom: 12px;">
                    <strong style="color: #1a1a1a;">Ticket ID:</strong>
                  </td>
                  <td style="color: #1a1a1a; font-size: 14px; text-align: right; padding-bottom: 12px;">
                    #${data.ticketNumber}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border-top: 1px solid #e5e5e5; padding-top: 12px;">
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      <strong style="color: #1a1a1a;">Subject:</strong>
                    </p>
                    <p style="margin: 8px 0 0 0; color: #1a1a1a; font-size: 14px;">
                      ${data.subject}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
          Our support team will review your request and get back to you as soon as possible.
        </p>
      `;
      htmlContent = emailWrapper(content);
    }
    else if (type === 'TICKET_RESOLVED') {
      subject = `Support Ticket Resolved - Ticket #${data.ticketNumber}`;
      const content = `
        <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">
          Your Issue Has Been Resolved
        </h2>
        <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6; text-align: center;">
          Good news! Your support ticket has been successfully resolved.
        </p>
        
        <!-- Resolution Details Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="background-color: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 8px; padding: 25px;">
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr>
                  <td style="color: #666666; font-size: 14px; padding-bottom: 12px;">
                    <strong style="color: #1a1a1a;">Ticket ID:</strong>
                  </td>
                  <td style="color: #1a1a1a; font-size: 14px; text-align: right; padding-bottom: 12px;">
                    #${data.ticketNumber}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border-top: 1px solid #e5e5e5; padding-top: 12px;">
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      <strong style="color: #1a1a1a;">Resolution:</strong>
                    </p>
                    <p style="margin: 12px 0 0 0; color: #1a1a1a; font-size: 14px; line-height: 1.6;">
                      ${data.resolution}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
          If you need further assistance, feel free to raise a new support ticket.
        </p>
      `;
      htmlContent = emailWrapper(content);
    }
    else if (type === 'SUBSCRIPTION_REMINDER') {
      subject = `Action Required: Your Subscription Ends in ${data.daysRemaining} Days`;
      const content = `
        <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">
          Subscription Expiring Soon
        </h2>
        <p style="margin: 0 0 20px 0; color: #666666; font-size: 15px; line-height: 1.6; text-align: center;">
          This is a reminder that your <strong>${data.planName || 'RealSalePro'}</strong> subscription is set to expire in <strong>${data.daysRemaining} days</strong> on ${data.expiryDate}.
        </p>
        <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6; text-align: center;">
          To ensure uninterrupted access to your data and premium features, please renew your plan today.
        </p>
        
        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 10px 0 30px 0;">
              <a href="${BASE_URL}/subscription" style="background-color: #4F46E5; color: #ffffff; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
                Renew Subscription
              </a>
            </td>
          </tr>
        </table>

        <div style="background-color: #FFF4E5; border: 1px solid #FFE0B2; border-radius: 8px; padding: 15px; text-align: center; margin-top: 10px;">
          <p style="margin: 0; color: #B76E00; font-size: 13px;">
            <strong>Note:</strong> If you've already made a payment, please disregard this message.
          </p>
        </div>
      `;
      htmlContent = emailWrapper(content);
    }
    else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email type' }) };
    }

    const mailOptions = {
      from: `"RealSalePro Support" <${process.env.EMAIL_USER}>`,
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
