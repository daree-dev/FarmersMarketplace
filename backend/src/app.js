require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true, // required for cookies to be sent cross-origin
}));
app.use(express.json());
app.use(cookieParser());
app.use(require('./routes'));

module.exports = app;
