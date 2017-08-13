import * as AWS from "aws-sdk";
import * as KMS from "aws-sdk/clients/kms";
import { ceil, isEmpty, isString } from "lodash";
import { logger } from "./logger";

if (process.env.IS_LOCAL) {
  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: process.env.AWS_PROFILE });
}

const client = new KMS();

const decrypt = async (blob: string) => {
  const ciphertext = Buffer.from(blob, "base64");
  try {
    return (await client.decrypt({ CiphertextBlob: ciphertext }).promise()) .Plaintext .toString();
  } catch (error) {
    logger.error(`${error.name}: ${error.message}`);
    throw error;
  }
};

const obfuscate = (value: string) => {
  const size = value.length;
  const threshold = ceil(size * 0.75);
  const endsWith = value.substring(threshold);
  return Array(threshold).join("*") + endsWith;
};

/**
 * Is true when `value` is undefined, null, blank string
 * @param value
 */
const isBlank = (value: any) => isEmpty(value) || (isString(value) && value.trim().length === 0);

const decryptEnv = async (key: string) => {
  logger.silly(`Request decrypt ENV: ${key}`);
  const blob = process.env[key];
  if (isBlank(blob)) {
    logger.error(`Wont decrypt blank ENV: ${key}`);
    throw new Error("DecryptErrorBlankEnv");
  }
  const value = await decrypt(blob);
  logger.silly(`Successfully decrypted ENV: ${key}=${obfuscate(value)}`);
  return value;
};

export { decrypt, decryptEnv };
