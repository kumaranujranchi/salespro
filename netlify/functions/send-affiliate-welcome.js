const nodemailer = require('nodemailer');

const BASE_URL = process.env.URL || 'https://realsalepro.com';
const LOGO_URL = `${BASE_URL}/images/RealSalePro_DarkLogo.png`;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { email, name, referralCode } = JSON.parse(event.body);

    if (!email || !referralCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: email or referralCode' }),
      };
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email service not configured' }),
      };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.EMAIL_PORT || '465', 10),
      secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const subject = `Welcome to the RealSalePro Partner Program!`;
    const dashboardLink = `${BASE_URL}/affiliate/dashboard`;
    
    // HTML Template
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
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
                
                <!-- Logo -->
                <tr>
                  <td align="center" style="padding: 40px 40px 20px 40px;">
                    <img src="${LOGO_URL}" alt="RealSalePro Logo" style="width: 180px; height: auto; display: block;">
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 20px 50px 50px 50px;">
                    <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">
                      Welcome to the Partner Program! 🚀
                    </h2>
                    <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6; text-align: center;">
                      Hi <strong>${name || 'Partner'}</strong>,<br>
                      Thanks for joining us. You can now start earning 20% commission on every referral.
                    </p>
                    
                    <!-- Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px 0;">
                          <div style="background-color: #ECFDF5; border: 1px solid #D1FAE5; border-radius: 8px; padding: 20px 40px; display: inline-block;">
                            <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 5px;">Your Referral Code</div>
                            <div style="font-size: 32px; font-weight: 700; color: #059669; font-family: 'Courier New', monospace;">
                              ${referralCode}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>

                     <!-- Dashboard Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 10px 0;">
                          <a href="${dashboardLink}" style="background-color: #10B981; color: #ffffff; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
                            Go to Your Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 30px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
                     <p style="margin: 0; color: #999999; font-size: 12px;">
                      RealSalePro Partner Program
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

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Welcome email sent successfully' }),
    };

  } catch (error) {
    console.error('Error sending affiliate welcome email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send welcome email', 
        details: error.message 
      }),
    };
  }
};
