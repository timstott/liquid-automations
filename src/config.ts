import { decrypt } from "./kms";

import * as Rollbar from "rollbar";

const envs = {
  GIT_SHA: process.env.GIT_SHA,
  LIQUI_LOGIN: process.env.LIQUI_LOGIN,
  LIQUI_OTP_SECRET: process.env.LIQUI_OTP_SECRET,
  LIQUI_PASSWORD: process.env.LIQUI_PASSWORD,
  NODE_ENV: process.env.NODE_ENV,
  ROLLBAR_TOKEN: process.env.ROLLBAR_TOKEN,
};

const isProduction = () => envs.NODE_ENV === "production";

const initializeRollbar = async () =>
   new Rollbar({
    accessToken: await decrypt(envs.ROLLBAR_TOKEN),
    captureUncaught: isProduction(),
    captureUnhandledRejections: isProduction(),
    payload: {
      environment: envs.NODE_ENV,
      server: {
        branch: envs.GIT_SHA,
      },
    },
  });

export { envs, initializeRollbar };
