// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Twilio credentials
const twilioSid = process.env.TWILIO_SID;
const twilioToken = process.env.TWILIO_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

const client = twilio(twilioSid, twilioToken);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Utility function for logging
const logMessage = (message) => {
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - ${message}\n`);
};

// Send a regular WhatsApp message
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

// Send an interactive message (buttons)
const sendInteractiveMessage = async (to) => {
    try {
        await client.messages.create({
            from: `whatsapp:${twilioNumber}`,
            to: `whatsapp:${to}`,
            contentType: 'application/json',
            content: {
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: {
                        text: '🌾 Welcome to Sugee.io! 🌾\n\nChoose a service below:'
                    },
                    action: {
                        buttons: [
                            {
                                type: 'reply',
                                reply: { id: '1', title: 'Apply for Agriculture Loan' }
                            },
                            {
                                type: 'reply',
                                reply: { id: '2', title: 'Customer Support & Assistance' }
                            }
                        ]
                    }
                }
            }
        });
        logMessage(`Interactive message sent to ${to}`);
    } catch (error) {
        logMessage(`Error sending interactive message: ${error.message}`);
    }
};

// Responses map
const responses = {
    '1': '🌱 Agriculture Loan: Apply easily for crop loans with quick approval and minimal paperwork. Would you like to proceed?',
    '2': '🤝 Support & Help: Our team is here to assist you with any queries or issues. How can we help you today?',
};

// Webhook to handle incoming messages
app.post('/webhook', async (req, res) => {
    const incomingMsg = (req.body.Body || '').trim().toLowerCase();
    const sender = req.body.From.replace('whatsapp:', '') || '';

    logMessage(`Received: '${incomingMsg}' from ${sender}`);

    // Handle the "hi" message and send the welcome message
    if (incomingMsg === 'hi' || incomingMsg === 'hello') {
        await sendInteractiveMessage(sender);
    } else if (responses[incomingMsg]) {
        // Handle valid option responses (e.g., "1" or "2")
        await sendMessage(sender, responses[incomingMsg]);
    } else {
        // Handle invalid options
        await sendMessage(sender, '❌ Invalid option. Please select from the available buttons.');
    }

    // Respond to Twilio
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

// Start the Express server
app.listen(port, () => {
    console.log(`WhatsApp bot running on port ${port}`);
});
