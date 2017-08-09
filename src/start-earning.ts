import axios, { AxiosResponse } from "axios";
import { find, floor, isPlainObject, min } from "lodash";
import * as Rollbar from "rollbar";
import { totp } from "speakeasy";
import { envs, initializeRollbar } from "./config";
import { decrypt } from "./kms";

const PRECISION = 4;

interface IConfig {
  currencyId: number;
  rollbar: Rollbar;
  userInterestLimitAmount: number;
}

const LIQUI_BASE = "https://liqui.io";

const liqui = axios.create({
  baseURL: LIQUI_BASE,
  timeout: 10000,
});

const makeError = (message: string, meta?: any) => {
  const err = new Error(message);
  if (meta) {
    return Object.assign({}, err, { meta});
  }
  return err;
};

// Reject responses with logical errors in addition to responses with
// erroneous HTTP codes
const rejectErroneousResponse = (response: AxiosResponse) => {
  const { data } = response;
  if (isPlainObject(data)) {
    const { Info: { IsSuccess: success, Errors: errors } } = data;
    if (!success) {
      return Promise.reject(makeError("LiquiError", errors));
    }
  }
  return response;
};

liqui.interceptors.response.use(rejectErroneousResponse, Promise.reject);

const authenticate = async () =>
  liqui.post("/User/Login", {
    login: await decrypt(envs.LIQUI_LOGIN),
    password: await decrypt(envs.LIQUI_PASSWORD),
  });

const activateSession = async ({ data }: AxiosResponse) => {
  const { Value: { Session: { SessionKey } } } = data;
  const token = totp({
    encoding: "hex",
    secret: await decrypt(envs.LIQUI_OTP_SECRET),
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

const findCurrencyById = ({ data }: AxiosResponse, currencyId: number) => {
  const currency = find(data, (e: any) => (e.CurrencyId === currencyId));
  if (!currency) { throw makeError("CurrencyUnavailable"); }
  return currency;
};

const userBalanceForCurrencyId = async (currencyId: number) =>
  findCurrencyById(await liqui.get("/User/Balances"), currencyId);

const exchangeAvailableInterestAmount = async (currencyId: number) => {
  const response = await liqui.get("/Interest/Records");
  const { CurrentAmount, MaxAmountLimit } = findCurrencyById(response, currencyId);

  return floor(MaxAmountLimit - CurrentAmount, PRECISION);
};

const startEarning = async ({ currencyId, rollbar, userInterestLimitAmount }: IConfig) => {
  const { InInterest: userCurrentAmount } = await userBalanceForCurrencyId(currencyId);
  const exchangeAvailableAmount = await exchangeAvailableInterestAmount(currencyId);

  const userAvailableAmount = floor(userInterestLimitAmount - userCurrentAmount, PRECISION);

  if (userAvailableAmount <= 0) {
    throw new Error("UserLimitReached");
  }

  // invest maximum allowed amount
  // example:
  // userAvailableAmount = 10
  // exchangeAvailableAmount = 60
  // min(10, 60)
  // invest 10
  const amount = min([userAvailableAmount, exchangeAvailableAmount]);

  console.log(`User amount to invest ${amount}`);
  rollbar.info(`User amount to invest ${amount}`);

  return liqui.post("/Interest/Create", {
    Amount: `${amount}`,
    CurrencyId: currencyId,
  });
};

const peekAvailability = async ({ currencyId, rollbar }: IConfig) => {
  const amount = await exchangeAvailableInterestAmount(currencyId);

  if (amount <= 0) { throw new Error("ExchangeMaxAmountReached"); }

  console.log(`Exchange current amount available to invest ${amount}`);
  rollbar.info(`Exchange current amount available to invest ${amount}`);
};

const startEarningHandler = async (event: any, _context: any, callback: any) => {
  const { currencyId, userInterestLimitAmount } = event;

  const config = {
    currencyId,
    rollbar: await initializeRollbar(),
    userInterestLimitAmount,
  };

  const { rollbar } = config;

  try {
    await peekAvailability(config);
    await activateSession(await authenticate());

    await startEarning(config);
  } catch (error) {
    if (error.message === "ExchangeMaxAmountReached") {
      console.log("Exchange max amount reached");
      rollbar.debug("Exchange max amount reached");
    } else {
      rollbar.error(error, null, { meta: JSON.stringify(error.meta) });
    }
  }
  callback();
};

export { startEarningHandler };
