// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const fs = require('fs');

const app = express();

require('dotenv').config();
const port = process.env.PORT;

const twilioSid = process.env.TWILIO_SID;
const twilioToken = process.env.TWILIO_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

const client = twilio(twilioSid, twilioToken);

const welcomeMessage = `
🌾 Welcome to Sugee.io! 🌾

We offer the following services:
1. Apply for a Loan
2. Spray Booking
3. Insurance
4. Soil Testing
5. Warehouse Booking
6. Agri Input
7. Schemes
8. Other
9. Customer Support & Assistance

Please reply with a number (1 to 9) to proceed.
`;

const responses = {
    '1': `🌱 Agriculture Loan: Select the type of loan you want to apply for:
    1. KCC (Kisan Credit Card)
    2. Crop Loan
    3. MT/LT (Medium/Long Term Loan)

Please reply with 1, 2, or 3.`,

    '1.1': '💳 KCC Loan: How much amount do you want to apply for? Please enter the amount.',
    '1.2': '🌾 Crop Loan: How much amount do you want to apply for? Please enter the amount.',
    '1.3': '📊 MT/LT Loan: How much amount do you want to apply for? Please enter the amount.',

    // Dynamic response after amount is entered
    '1.1.amount': '✅ Thank you for applying for a KCC Loan. Our team will contact you soon.',
    '1.2.amount': '✅ Thank you for applying for a Crop Loan. Our team will contact you soon.',
    '1.3.amount': '✅ Thank you for applying for an MT/LT Loan. Our team will contact you soon.',

    // Other services remain the same
    '2': '🚜 Spray Booking: Book agricultural spray services quickly and efficiently. Would you like to continue?',
    '3': '🛡️ Insurance: Secure your crops with our comprehensive agricultural insurance plans. Would you like to proceed?',
    '4': '🧪 Soil Testing: Get accurate soil testing services to optimize your crop yield. Would you like to continue?',
    '5': '🏢 Warehouse Booking: Reserve warehouse space for your agricultural products with ease. Would you like to proceed?',
    '6': '🌾 Agri Input: Access quality agricultural inputs such as seeds, fertilizers, and pesticides. Would you like to continue?',
    '7': '📋 Schemes: Explore government and private agricultural schemes to maximize your benefits. Would you like to proceed?',
    '8': '🔍 Other Services: Explore additional agricultural services tailored to your needs. How can we assist you?',
    '9': '🤝 Support & Help: Our team is here to assist you with any queries or issues. How can we help you today?',

    'default': '❌ Invalid option. Please reply with a number between 1 and 9 to select a service.'
};


let userState = {};

app.use(bodyParser.urlencoded({ extended: false }));

const logMessage = (message) => {
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - ${message}\n`);
};

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

app.post('/webhook', (req, res) => {
    const incomingMsg = (req.body.Body || '').trim().toLowerCase();
    const sender = req.body.From || '';

    logMessage(`Received: '${incomingMsg}' from ${sender}`);

    let reply = responses.default;

    if (incomingMsg === 'hi') {
        reply = welcomeMessage;
    } else if (responses[incomingMsg]) {
        reply = responses[incomingMsg];
    } else if (userState[sender] === 'awaitingAmount') {
        reply = `✅ Thank you! We have received your loan request for ${incomingMsg}. Our team will contact you soon.`;
        delete userState[sender];
    } else if (incomingMsg === '1') {
        reply = responses['1'];
    } else if (['1.1', '1.2', '1.3'].includes(incomingMsg)) {
        reply = responses[incomingMsg];
        userState[sender] = 'awaitingAmount';
    }

    if (sender && sender !== `whatsapp:${twilioNumber}`) {
        sendMessage(sender.replace('whatsapp:', ''), reply);
    } else {
        logMessage('Skipping reply: Invalid sender or self-message');
    }

    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

app.listen(port, () => {
    console.log(`WhatsApp bot running on port ${port}`);
});
