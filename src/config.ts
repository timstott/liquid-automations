import { decryptEnv } from "./kms";

import * as Rollbar from "rollbar";

const envs = {
  GIT_SHA: process.env.GIT_SHA,
  NODE_ENV: process.env.NODE_ENV,
  ROLLBAR_TOKEN: process.env.ROLLBAR_TOKEN,
};

const isProduction = () => envs.NODE_ENV === "production";

const initializeRollbar = async () =>
   new Rollbar({
    accessToken: await decryptEnv("ROLLBAR_TOKEN"),
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
