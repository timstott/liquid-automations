import * as winston from "winston";

type NODE_ENV_TYPE = "dev" | "test" | "production";
const NODE_ENV = process.env.NODE_ENV as NODE_ENV_TYPE;

type LOG_LEVEL_TYPE = "error" | "warn" | "info" | "verbose" | "debug" | "silly";
const LOG_LEVEL = process.env.LOG_LEVEL as LOG_LEVEL_TYPE;

const consoleTransport = new winston.transports.Console({ timestamp: true });
const fileTransport = new winston.transports.File({
  filename: "log/test.log", json: false,
});

const transports = {
  dev: [ consoleTransport ],
  production: [ consoleTransport ],
  test: [ fileTransport ],
};

const logger = new winston.Logger({
  level: LOG_LEVEL,
  transports: transports[NODE_ENV],
});

export { logger };
