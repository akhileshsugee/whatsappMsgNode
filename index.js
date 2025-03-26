// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const fs = require('fs');

const app = express();

require('dotenv').config();
const port = process.env.PORT || 3000;

// Twilio credentials
const twilioSid = process.env.TWILIO_SID;
const twilioToken = process.env.TWILIO_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

const client = twilio(twilioSid, twilioToken);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Utility function to log messages
const logMessage = (message) => {
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - ${message}\n`);
};

// Send WhatsApp interactive message (with buttons)
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
                        text: '🌾 Welcome to Sugee.io! 🌾\n\nWe offer the following services:'
                    },
                    action: {
                        buttons: [
                            {
                                type: 'reply',
                                reply: {
                                    id: '1',
                                    title: 'Apply for Agriculture Loan'
                                }
                            },
                            {
                                type: 'reply',
                                reply: {
                                    id: '2',
                                    title: 'Customer Support & Assistance'
                                }
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

// Send standard WhatsApp message
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

// Response messages
const responses = {
    '1': '🌱 Agriculture Loan: Apply easily for crop loans with quick approval and minimal paperwork. Would you like to proceed?',
    '2': '🤝 Support & Help: Our team is here to assist you with any queries or issues. How can we help you today?',
    'default': '❌ Invalid option. Please use the buttons to select a valid option.'
};

// Handle incoming messages
app.post('/webhook', async (req, res) => {
    const incomingMsg = (req.body.Body || '').trim().toLowerCase();
    const sender = req.body.From.replace('whatsapp:', '') || '';

    logMessage(`Received: '${incomingMsg}' from ${sender}`);

    // Send the welcome message with buttons if the user says 'hi'
    if (incomingMsg === 'hi' || incomingMsg === 'hello') {
        await sendInteractiveMessage(sender);
    } else if (responses[incomingMsg]) {
        await sendMessage(sender, responses[incomingMsg]);
    } else {
        await sendMessage(sender, responses.default);
    }

    // Respond to Twilio
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

// Start server
app.listen(port, () => {
    console.log(`WhatsApp bot running on port ${port}`);
});
