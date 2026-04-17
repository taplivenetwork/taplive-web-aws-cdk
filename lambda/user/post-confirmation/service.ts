import { getSecret } from "@shared/aws";
import { createUserProfile } from "./repository";

export async function createUserProfileFromCognito(
  cognitoId: string,
  email: string,
  name: string,
) {
  const secretArn = process.env.DB_CREDENTIALS_SECRET_ARN;

  if (!secretArn) {
    throw new Error("DB_CREDENTIALS_SECRET_ARN is not defined");
  }

  const credentials = await getSecret(secretArn);
  await createUserProfile(credentials, cognitoId, email, name);
}
