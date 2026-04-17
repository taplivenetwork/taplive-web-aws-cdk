import { getSecret } from "@shared/aws";
import { createUserProfile } from "./repository";

/**
 * Creates a user profile from a Cognito post-confirmation event.
 *
 * @see {@link createUserProfile} for internal db logic
 * @param cognitoId
 * @param email
 * @param name
 */
export async function createUserProfileFromCognito(
  cognitoId: string,
  email: string,
  name: string,
  secretArn: string,
) {
  const credentials = await getSecret(secretArn);
  await createUserProfile(credentials, cognitoId, email, name);
}
