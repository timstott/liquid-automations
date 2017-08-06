const axios = require('axios');
const find = require('lodash.find');
const min = require('lodash.min');
const floor = require('lodash.floor');
const isPlainObject = require('lodash.isplainobject');
const speakeasy = require('speakeasy');
const { rollbar } = require('./config');

const PRECISION = 4;
const CURRENCY_ID = parseInt(process.env.CURRENCY_ID, 10);
const USER_LIMIT = parseFloat(process.env.USER_LIMIT);

const LIQUI_LOGIN = process.env.LIQUI_LOGIN;
const LIQUI_PASSWORD = process.env.LIQUI_PASSWORD;
const LIQUI_OTP_SECRET = process.env.LIQUI_OTP_SECRET;
const LIQUI_BASE = 'https://liqui.io';

const liqui = axios.create({
  baseURL: LIQUI_BASE,
  timeout: 10000,
});

const makeError = (message, meta) => {
  const err = new Error(message);
  if (meta) {
    err.meta = meta;
  }
  return err;
};

// Reject responses with logical errors in addition to responses with
// erroneous HTTP codes
const rejectErroneousResponse = (response) => {
  const { data } = response;
  if (isPlainObject(data)) {
    const { Info: { IsSuccess: success, Errors: errors } } = data;
    if (!success) {
      return Promise.reject(makeError('LiquiError', errors));
    }
  }
  return response;
};

liqui.interceptors.response.use(rejectErroneousResponse, Promise.reject);

const authenticate = () =>
  liqui.post('/User/Login', {
    login: LIQUI_LOGIN,
    password: LIQUI_PASSWORD,
  });

const activateSession = (response) => {
  const { Value: { Session: { SessionKey } } } = response.data;
  const token = speakeasy.totp({
    encoding: 'hex',
    secret: LIQUI_OTP_SECRET,
  });

  return liqui
    .post(`${LIQUI_BASE}/User/Session/Activate`, {
      Code: token,
      Key: SessionKey,
    })
    .then((req) => {
      liqui.defaults.headers.common.Cookie = `sessionKey=${SessionKey};`;
      return req;
    });
};

const findCurrencyById = (response) => {
  const { data } = response;
  const currency = find(data, e => (e.CurrencyId === CURRENCY_ID));

  if (!currency) {
    throw makeError('CurrencyUnavailable');
  }
  return currency;
};

const userCurrencyBalance = () => liqui.get('/User/Balances').then(findCurrencyById);
const exchangeInterestBalance = () => liqui.get('/Interest/Records').then(findCurrencyById);

const exchangeAvailableInterestAmount = () =>
  exchangeInterestBalance().then((currency) => {
    const { CurrentAmount, MaxAmountLimit } = currency;
    return floor(MaxAmountLimit - CurrentAmount, PRECISION);
  });

const startEarning = () =>
  Promise.all([userCurrencyBalance(), exchangeAvailableInterestAmount()]).then((responses) => {
    const [
      // user currency data
      { InInterest: userCurrentAmount },
      // excahnge interest data
      exchangeAvailableAmount,
    ] = responses;

    const userAvailableAmount = floor(USER_LIMIT - userCurrentAmount, PRECISION);

    if (userAvailableAmount <= 0) {
      throw new Error('UserLimitReached');
    }

    // invest maximum allowed amount
    // example:
    // userAvailableAmount = 10
    // exchangeAvailableAmount = 60
    // min(10, 60)
    // invest 10
    const amount = min([userAvailableAmount, exchangeAvailableAmount]);

    rollbar.info(`User amount to invest ${amount}`);
    return liqui
      .post('/Interest/Create', {
        Amount: `${amount}`,
        CurrencyId: CURRENCY_ID,
      });
  });


const peekAvailability = () =>
  exchangeAvailableInterestAmount().then((amount) => {
    if (amount <= 0) {
      throw new Error('ExchangeMaxAmountReached');
    }
    rollbar.info(`Exchange current amount available to invest ${amount}`);
  });

peekAvailability()
  .then(authenticate)
  .then(activateSession)
  .then(startEarning)
  .catch((error) => {
    if (error.message === 'ExchangeMaxAmountReached') {
      rollbar.debug('Exchange max amount reached');
    } else {
      rollbar.error(error, null, { meta: JSON.stringify(error.meta) });
    }
  });
