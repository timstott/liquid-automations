import * as KMS from "aws-sdk/clients/kms";

const client = new KMS();

const decrypt = (blob: string) => {
  const ciphertext = Buffer.from(blob, "base64");
  return client
    .decrypt({ CiphertextBlob: ciphertext })
    .promise()
    .then((result) => result.Plaintext.toString());
};

export { decrypt };
