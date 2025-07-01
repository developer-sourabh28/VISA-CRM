import nodemailer from 'nodemailer';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER || 'bansotiyas@gmail.com',
        pass: process.env.EMAIL_PASS || 'pqlw fykm iads lxfy'
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Email templates
const emailTemplates = {
    enquiryConfirmation: (enquiry) => ({
        subject: 'Thank you for your enquiry - Visa Services',
        html: `
            <h2>Dear ${enquiry.firstName} ${enquiry.lastName},</h2>
            <p>Thank you for your enquiry regarding our visa services. We have received your request and will get back to you shortly.</p>
            <p>Your enquiry details:</p>
            <ul>
                <li>Enquiry ID: ${enquiry._id}</li>
                <li>Visa Type: ${enquiry.visaType}</li>
                <li>Destination Country: ${enquiry.destinationCountry}</li>
            </ul>
            <p>Our team will review your enquiry and contact you within 24-48 business hours.</p>
            <p>Best regards,<br>Visa Services Team</p>
        `
    }),
    taskReminder: (task, enquiry) => ({
        subject: `Reminder: ${task.title} - Visa Services`,
        html: `
            <h2>Dear ${enquiry.firstName} ${enquiry.lastName},</h2>
            <p>This is a reminder about the following task:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
                <p><strong>Priority:</strong> ${task.priority}</p>
            </div>
            <p>Please take necessary action to complete this task.</p>
            <p>Best regards,<br>Visa Services Team</p>
        `
    }),
    meetingConfirmation: (meeting, enquiry) => ({
        subject: `Meeting Confirmation: ${meeting.meetingType} - Visa Services`,
        html: `
            <h2>Dear ${enquiry.firstName} ${enquiry.lastName},</h2>
            <p>This email confirms your scheduled meeting:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                <h3>${meeting.meetingType}</h3>
                <p><strong>Date & Time:</strong> ${new Date(meeting.dateTime).toLocaleString()}</p>
                <p><strong>Platform:</strong> ${meeting.platform}</p>
                <p><strong>Status:</strong> ${meeting.status}</p>
            </div>
            <p>Please make sure to join the meeting on time.</p>
            <p>Best regards,<br>Visa Services Team</p>
        `
    })
};

// Function to send email
const sendEmail = async (to, template, data) => {
    try {
        const { subject, html } = emailTemplates[template](data);
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'bansotiyas@gmail.com',
            to,
            subject,
            html
        };

        console.log('Sending email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            template: template
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', {
            error: error.message,
            code: error.code,
            command: error.command,
            stack: error.stack
        });
        throw error;
    }
};

export { sendEmail, emailTemplates }; 