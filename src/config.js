const Rollbar = require('rollbar');

const GIT_SHA = process.env.GIT_SHA;
const NODE_ENV = process.env.NODE_ENV;
const ROLLBAR_KEY = process.env.ROLLBAR_KEY;

const isProduction = () => NODE_ENV === 'production';

const rollbar = new Rollbar({
  accessToken: ROLLBAR_KEY,
  captureUncaught: isProduction(),
  captureUnhandledRejections: isProduction(),
  payload: {
    environment: NODE_ENV,
    server: {
      branch: GIT_SHA,
    },
  },
});

module.exports = { rollbar };
