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

    // --- TEMPLATE LOGIC ---
    if (type === 'OTP') {
      subject = 'Verify Your Email Address - SalesPro';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Welcome to SalesPro!</h2>
          <p>Hi ${name || 'User'},</p>
          <p>Thank you for registering. Please verify your email address.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; background: #f3f4f6; padding: 10px 20px; border-radius: 5px;">${data.otp}</span>
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `;
    } 
    else if (type === 'TICKET_CREATED') {
      subject = `[Ticket #${data.ticketNumber}] Request Received`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #10b981; text-align: center;">Request Received</h2>
          <p>Hi ${name || 'Admin'},</p>
          <p>We have received your support request.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Ticket ID:</strong> #${data.ticketNumber}</p>
          </div>
          <p>Our support team will review this shortly.</p>
        </div>
      `;
    }
    else if (type === 'TICKET_RESOLVED') {
      subject = `[Ticket #${data.ticketNumber}] Issue Resolved`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #10b981; text-align: center;">Issue Resolved</h2>
          <p>Hi ${name || 'Admin'},</p>
          <p>Good news! Your support ticket has been resolved.</p>
          <div style="background: #f0fff4; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #bbf7d0;">
            <p><strong>Ticket ID:</strong> #${data.ticketNumber}</p>
            <p><strong>Resolution:</strong> ${data.resolution}</p>
          </div>
          <p>If you need any further assistance, feel free to contact us.</p>
        </div>
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
