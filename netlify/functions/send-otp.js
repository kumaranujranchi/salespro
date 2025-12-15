const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { email, otp, name } = JSON.parse(event.body);

    if (!email || !otp) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email or OTP' }),
      };
    }

    // Create a transporter using SMTP
    // NOTE: These environment variables must be set in Netlify Dashboard
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"SalesPro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address - SalesPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Welcome to SalesPro!</h2>
          <p>Hi ${name || 'User'},</p>
          <p>Thank you for registering. Please verify your email address to complete your account setup.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; background: #f3f4f6; padding: 10px 20px; border-radius: 5px;">${otp}</span>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
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
