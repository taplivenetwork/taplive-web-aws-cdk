import AWS from "aws-sdk";

const secretsClient = new AWS.SecretsManager();

export async function getSecret(secretArn: string) {
  const response = await secretsClient
    .getSecretValue({ SecretId: secretArn })
    .promise();

  if (!response.SecretString) {
    throw new Error("SecretString is empty");
  }

  return JSON.parse(response.SecretString);
}
