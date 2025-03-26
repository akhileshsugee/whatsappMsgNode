// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT;

// Twilio credentials
const twilioSid = process.env.TWILIO_SID;
const twilioToken = process.env.TWILIO_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

// Ensure you add your Twilio Content SID from approved templates
const contentSid = process.env.TWILIO_CONTENT_SID;

const client = twilio(twilioSid, twilioToken);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Utility function to log messages
const logMessage = (message) => {
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - ${message}\n`);
};

// Send WhatsApp interactive message with buttons
const sendInteractiveMessage = async (to) => {
    try {
        await client.messages.create({
            from: `whatsapp:${twilioNumber}`,
            to: `whatsapp:${to}`,
            contentSid: contentSid,
            contentVariables: JSON.stringify({
                button1: 'Apply for Agriculture Loan',
                button2: 'Customer Support & Assistance'
            })
        });
        logMessage(`Interactive message sent to ${to}`);
    } catch (error) {
        logMessage(`Error sending interactive message: ${error.message}`);
    }
};

// Send plain WhatsApp message
const sendMessage = async (to, body) => {
    try {
        await client.messages.create({
            from: `whatsapp:${twilioNumber}`,
            to: `whatsapp:${to}`,
            body
        });
        logMessage(`Message sent to ${to}: ${body}`);
    } catch (error) {
        logMessage(`Error sending message: ${error.message}`);
    }
};

// Business plan responses
const responses = {
    'loan': '🌱 Agriculture Loan: Apply easily for crop loans with quick approval and minimal paperwork. Would you like to proceed?',
    'support': '🤝 Support & Help: Our team is here to assist you with any queries or issues. How can we help you today?',
    'default': '❌ Invalid option. Please select a valid option using the buttons.'
};

// Handle incoming messages
app.post('/webhook', (req, res) => {
    const incomingMsg = (req.body.Body || '').trim().toLowerCase();
    const sender = req.body.From || '';

    logMessage(`Received: '${incomingMsg}' from ${sender}`);

    if (!sender.startsWith('whatsapp:')) {
        logMessage('Invalid sender - ignoring message');
        return res.sendStatus(200);
    }

    const senderNumber = sender.replace('whatsapp:', '');

    if (incomingMsg === 'hi') {
        sendInteractiveMessage(senderNumber);
    } else if (incomingMsg === '1') {
        sendMessage(senderNumber, responses['loan']);
    } else if (incomingMsg === '2') {
        sendMessage(senderNumber, responses['support']);
    } else {
        sendMessage(senderNumber, responses['default']);
    }

    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

// Start server
app.listen(port, () => {
    console.log(`🚀 WhatsApp bot running on port ${port}`);
});
