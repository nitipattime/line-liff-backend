const express = require('express');
const { resolve } = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3010;

// app.use(express.static('static'));
app.use(express.json());

require('dotenv').config();

// const corsOptions = {
//   origin: 'https://line-liff-sand.vercel.app/',
//   credentials: true,
// };
// app.use(function (req, res, next) {

//   // Website you wish to allow to connect
//   res.setHeader('Access-Control-Allow-Origin', '*');

//   // Request methods you wish to allow
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

//   // Request headers you wish to allow
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

//   // Set to true if you need the website to include cookies in the requests sent
//   // to the API (e.g. in case you use sessions)
//   res.setHeader('Access-Control-Allow-Credentials', true);

//   // Pass to next layer of middleware
//   next();
// });
// app.use(cors());
// app.options('*', cors());

const corsOptions = {
  origin: '*', // Replace with your allowed origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Enable credentials (cookies, authorization headers, etc.)
  optionsSuccessStatus: 204, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

const LINE_API_TOKEN_URL = 'https://api.line.me/v2/oauth/accessToken';
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

const sendMessage = async (userUid, message, accessToken) => {
  const body = {
    to: userUid,
    messages: [
      {
        type: 'text',
        text: message,
        wrap: true,
      },
    ],
  };

  const headersNew = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
  };

  console.log("accessToken : ")
  console.dir(accessToken)

  const response = await axios.post(LINE_API_URL, body, { headersNew });
  return response;
};

app.post('/send-message', async (req, res) => {
  const { userUid, message } = req.body;
  console.log(userUid);
  console.log(message);
  // res.json({
  //   userUid: userUid,
  //   message: message,
  // });
  try {
    // New Code Start
    const bodyAccessToken = {
      // grant_type: 'client_credentials',
      'grant_type': 'authorization_code',
      'client_id': '1657087554',
      'client_secret': '4329ae075f1c36f68af690defab1306d',
    };

    const headersAccessToken = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    const responseAccessToken = await axios.post(LINE_API_TOKEN_URL, bodyAccessToken, { headersAccessToken });
    console.log(responseAccessToken)
    // New Code End

    // const response = await sendMessage(userUid, message, responseAccessToken.data);
    // console.log('=== LINE log', response.data);
    res.json({
      message: 'Message OK',
      log: responseAccessToken,
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
    let commandMessage = 'UserID : ' + lineUserID + '\n' + 'Message : ' + lineEvent.message.text;
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
