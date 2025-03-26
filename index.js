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

// Business plan responses
const welcomeMessage = {
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
};

const responses = {
    '1': '🌱 Agriculture Loan: Apply easily for crop loans with quick approval and minimal paperwork. Would you like to proceed?',
    '2': '🤝 Support & Help: Our team is here to assist you with any queries or issues. How can we help you today?',
    'default': '❌ Invalid option. Please use the provided buttons to select an option.'
};

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Utility function to log messages
const logMessage = (message) => {
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - ${message}\n`);
};

// Send WhatsApp message
const sendMessage = async (to, body, isInteractive = false) => {
    try {
        const messageData = {
            from: `whatsapp:${twilioNumber}`,
            to: `whatsapp:${to}`
        };

        if (isInteractive) {
            messageData.content = body.content;
        } else {
            messageData.body = body;
        }

        const message = await client.messages.create(messageData);
        logMessage(`Message sent to ${to}: ${isInteractive ? JSON.stringify(body) : body}`);
    } catch (error) {
        logMessage(`Error sending message: ${error.message}`);
    }
};

// Handle incoming messages
app.post('/webhook', (req, res) => {
    const incomingMsg = (req.body.Body || '').trim().toLowerCase();
    const sender = req.body.From || '';

    logMessage(`Received: '${incomingMsg}' from ${sender}`);

    if (sender && sender !== `whatsapp:${twilioNumber}`) {
        if (incomingMsg === 'hi') {
            sendMessage(sender.replace('whatsapp:', ''), welcomeMessage, true);
        } else if (responses[incomingMsg]) {
            sendMessage(sender.replace('whatsapp:', ''), responses[incomingMsg]);
        } else {
            sendMessage(sender.replace('whatsapp:', ''), responses.default);
        }
    } else {
        logMessage('Skipping reply: Invalid sender or self-message');
    }

    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

// Start server
app.listen(port, () => {
    console.log(`WhatsApp bot running on port ${port}`);
});