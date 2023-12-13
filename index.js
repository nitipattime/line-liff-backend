const express = require('express');
const { resolve } = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3010;

// app.use(express.static('static'));
app.use(express.json());

require('dotenv').config();
app.use(cors());

const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

app.get('/', (req, res) => {
  // res.sendFile(resolve(__dirname, 'pages/index.html'));
  res.json({
    message: 'Message OK',
  });
});

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
};

const sendMessage = async (userUid, message) => {
  const body = {
    to: userUid,
    messages: [
      {
        type: 'text',
        text: message,
      },
    ],
  };
  const response = await axios.post(LINE_API_URL, body, { headers });
  return response;
};

app.post('/send-message', async (req, res) => {
  const { userUid, message } = req.body;
  console.log(userUid);
  console.log(message);
  try {
    const response = await sendMessage(userUid, message);
    console.log('=== LINE log', response.data);
    res.json({
      message: 'Message OK',
    });
  } catch (error) {
    console.log('error', error.response.data);
    res.status(400).json({
      error: error.response,
    });
  }
});

app.post('/webhook', async (req, res) => {
  const { events } = req.body;

  if (!events || events.length <= 0) {
    console.log('error event not found');
    res.json({
      message: 'event not found !',
    });
    return false;
  }
  console.log('event', events);
  try {
    const lineEvent = events[0];
    const lineUserID = lineEvent.source.userId;
    let commandMessage = 'UserID : ' + lineUserID;
    const response = await sendMessage(lineUserID, commandMessage);
    res.json({
      message: 'Send Message Success',
      responseData: response.data,
    });
  } catch (error) {
    console.log('error', error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

module.exports = app
