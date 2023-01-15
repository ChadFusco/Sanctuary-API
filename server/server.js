// REQUIRE STATEMENTS
require('dotenv').config();
// eslint-disable-next-line import/no-extraneous-dependencies
const debug = require('debug')('http');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
// const db = require('./db');

const app = express();

// APP-WIDE MIDDLEWARE
app.use((req, res, next) => {
  debug('Request rcvd, Morgan starting...');
  next();
});
app.use(morgan('dev'));
app.use((req, res, next) => {
  debug('Morgan complete. Remaining middleware starting...');
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

app.get('/', (req, res) => {
  res.status(200).send('Sanctuary API server successfully accessed');
});

// ROUTES

module.exports = app;
