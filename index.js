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
    'default': '❌ Invalid option. Please select a valid option using the buttons.'
};

app.use(bodyParser.urlencoded({ extended: false }));

const logMessage = (message) => {
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - ${message}\n`);
};

const sendMessage = async (to, content) => {
    try {
        const messageData = {
            from: `whatsapp:${twilioNumber}`,
            to: `whatsapp:${to}`
        };

        // If content is an object (interactive), send as media
        if (typeof content === 'object') {
            messageData.contentType = content.contentType;
            messageData.content = JSON.stringify(content.content);
        } else {
            messageData.body = content; // Otherwise, send as plain text
        }

        const message = await client.messages.create(messageData);
        logMessage(`Message sent to ${to}: ${JSON.stringify(content)}`);
    } catch (error) {
        logMessage(`Error sending message: ${error.message}`);
    }
};

app.post('/webhook', async (req, res) => {
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
        await sendMessage(sender.replace('whatsapp:', ''), reply);
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
