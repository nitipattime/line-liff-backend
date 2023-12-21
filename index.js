const express = require('express');
const { resolve } = require('path');
const axios = require('axios');
const cors = require('cors');
var bodyParser = require('body-parser');

const app = express();
const port = 3010;

// app.use(express.static('static'));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

require('dotenv').config();
app.use(cors());

const LINE_MODULE_URI_ACCESSTOKENURL= 'https://api.line.me/v2/oauth/accessToken'
const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const LINE_CLIENT_ID = process.env.LINE_CLIENT_ID;
const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_ID;

app.get('/', (req, res) => {
  // res.sendFile(resolve(__dirname, 'pages/index.html'));
  res.json({
    message: 'Message OK',
  });
});

// const headers = {
//   'Content-Type': 'application/json',
//   Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
// };

const getAccessToken = async () => {
  const body = {
    'grant_type': 'client_credentials',
    'client_id': '1656289362',
    'client_secret': '2e7adad4e2e3ec78721848e23d2ecd88',
  };

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  console.dir(headers)

  const response = await axios.post(LINE_MODULE_URI_ACCESSTOKENURL, body, { headers });
  return response;
};


const sendMessage = async (userUid, message, accessToken) => {
  const body = {
    'to': userUid,
    'messages': [
      {
        'type': 'text',
        'text': message,
        'wrap': true,
      },
    ],
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-Line-Bot-Id': 'U01933a9bed6c888470e6b6bba7a9932d',
    // 'X-Line-Bot-Id': 'U493fc05deab767a9495a36aaac89f850',
    'Authorization': `Bearer ${accessToken}`,
  };

  console.dir(headers)

  const response = await axios.post(LINE_API_URL, body, { headers });
  return response;
};

app.post('/send-message', async (req, res) => {
  const { userUid, message, accessToken } = req.body;
  console.log(userUid);
  console.log(message);
  const accesstoken = await getAccessToken();
  // console.dir(accesstoken)
  console.log('accesstoken : '+accesstoken.data.access_token)

  try {
    const response = await sendMessage(userUid, message, accesstoken.data.access_token);
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

  const accesstoken = await getAccessToken();
  try {
    const lineEvent = events[0];
    const lineUserID = lineEvent.source.userId;
    let commandMessage
    let response
    switch(lineEvent.message.type) {
      case "text":
        commandMessage = 'UserID : ' + lineUserID + '\n' + 'Message : ' + lineEvent.message.text;
        response = await sendMessage(lineUserID, commandMessage, accesstoken.data.access_token);
        break;
      case "image":
        commandMessage = 'UserID : ' + lineUserID + '\n' + 'ImageSetID : ' + lineEvent.message.imageSet.id;
        response = await sendMessage(lineUserID, commandMessage, accesstoken.data.access_token);
        break;
    }
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
