// backend/server.js

require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');


const app = express();
const port = process.env.PORT || 5000; // Use port from environment variable or default to 5000

// Middleware
app.use(express.json());
app.use(cors()); // Enables CORS for all routes
app.use(bodyParser.json()); // Parses incoming request bodies as JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parses URL-encoded data

// Contact form submission endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, phone, subject, message } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !subject || !message) {
        return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    try {
        // Create a Nodemailer transporter using your email service (e.g., Gmail, Outlook)
        // You'll need to enable "Less secure app access" for Gmail, or use app passwords.
        // For production, consider a dedicated email service like SendGrid, Mailgun, etc.
        const transporter = nodemailer.createTransport({
            // service: 'gmail', // Or your email service (e.g., 'Outlook365', 'SMTP' for custom)
            host: 'cad.crystalregistry.com', // << REPLACE with Netcall Services SMTP host (e.g., smtp.netcallservices.com)
            port: 465,               // << REPLACE with correct SMTP port (e.g., 465 for SSL, 587 for TLS)
            secure: true,
            auth: {
                user: process.env.EMAIL_USER, // Your email address from .env
                pass: process.env.EMAIL_PASS, // Your email password or app-specific password from .env
            },
            tls: {
                rejectUnauthorized: false // Ignore invalid certificate hostname for development
            }
        });
 
        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: process.env.RECIPIENT_EMAIL, // Recipient email address (your business email)
            subject: `New Contact Form Submission: ${subject}`,
            html: `
                <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `,
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: 'Your message has been sent successfully!' });

    } catch (error) {
        console.error('Error sending email:', error);
        let errorMessage = 'There was an error sending your message. Please try again later.';

        if (error.code === 'EENVELOPE' || error.responseCode === 550) {
            errorMessage = 'Failed to send email. Please check the recipient email address or your email service configuration.';
        } else if (error.code === 'EAUTH' || error.responseCode === 535) {
            errorMessage = 'Authentication failed. Please check your email credentials (EMAIL_USER and EMAIL_PASS) in the .env file.';
        }

        res.status(500).json({ success: false, message: errorMessage });
    }
});

// Database connection
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/auth', authRoutes);
const productRoutes = require("./routes/products");
app.use("/api/products", productRoutes);
const ordersRouter = require('./routes/orders'); // Assuming you have a separate file for order routes
app.use('/api', ordersRouter);
const userRoutes = require('./routes/users'); // ✅ correct path
app.use('/api/users', userRoutes); // ✅ attach it to the app


// Start the server
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});