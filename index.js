// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const fs = require('fs');

const app = express();

require('dotenv').config();
const port = process.env.PORT;

// Twilio credentials
const twilioSid = process.env.TWILIO_SID;
const twilioToken = process.env.TWILIO_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

const client = twilio(twilioSid, twilioToken);

// Business plan responses
const welcomeMessage = `
Hi! Welcome to Sugee.io  Here's our Faclity:
1. Apply agriculture loan online 
2. Support and Help
`;

const responses = {
    '1': 'Apply CROP Lone',
    '2': 'Apply Nornam Lone',
    'default': 'Sorry, please type 1 or 2 to choose a plan!'
};

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Utility function to log messages
const logMessage = (message) => {
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - ${message}\n`);
};

// Send WhatsApp message
const sendMessage = async (to, body) => {
    try {
        const message = await client.messages.create({
            from: `whatsapp:${twilioNumber}`,
            to: `whatsapp:${to}`,
            body
        });
        logMessage(`Message sent to ${to}: ${body}`);
    } catch (error) {
        logMessage(`Error sending message: ${error.message}`);
    }
};

// Handle incoming messages
app.post('/webhook', (req, res) => {
    const incomingMsg = (req.body.Body || '').trim().toLowerCase();
    const sender = req.body.From || '';

    logMessage(`Received: '${incomingMsg}' from ${sender}`);

    let reply = responses.default;
    if (incomingMsg === 'hi') {
        reply = welcomeMessage;
    } else if (responses[incomingMsg]) {
        reply = responses[incomingMsg];
    }

    if (sender && sender !== `whatsapp:${twilioNumber}`) {
        sendMessage(sender.replace('whatsapp:', ''), reply);
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