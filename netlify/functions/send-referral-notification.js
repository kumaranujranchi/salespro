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
    const { email, referrerName, refereeName, rewardAmount, totalReferrals } = JSON.parse(event.body);

    console.log('Referral Notification function called with:', { email, referrerName, refereeName });

    if (!email) {
      console.error('Missing required fields: email');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email' }),
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

    const subject = `Congratulations! You've earned a new referral reward!`;
    const htmlContent = `
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
                    <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">
                      New Referral Successful! 🎉
                    </h2>
                    <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6; text-align: center;">
                      Great news, <strong>${referrerName}</strong>! 
                    </p>
                    <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6; text-align: center;">
                      A new user, <strong>${refereeName}</strong>, has successfully signed up using your referral code.
                    </p>
                    
                    <!-- Reward Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px 0;">
                          <div style="background-color: #ECFDF5; border: 1px solid #D1FAE5; border-radius: 8px; padding: 20px 40px; display: inline-block;">
                            <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 5px;">You Earned</div>
                            <div style="font-size: 36px; font-weight: 700; color: #059669; font-family: 'Courier New', monospace;">
                              ₹${rewardAmount}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                      You have now referred a total of <strong>${totalReferrals}</strong> users. Keep it up!
                    </p>
                    
                     <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 30px 0 10px 0;">
                          <a href="${BASE_URL}/referral-dashboard" style="background-color: #4F46E5; color: #ffffff; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
                            View Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

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
                      RealSalePro Referral Program
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

    const mailOptions = {
      from: `"RealSalePro Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    console.log('Sending referral notification to:', email);

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
