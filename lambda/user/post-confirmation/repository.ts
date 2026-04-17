import { queryWithCreds } from "@shared/db";

export interface DbCredentials {
  host: string;
  port: number;
  dbname: string;
  username: string;
  password: string;
}

/**
 * Create a user profile in the `users` table after Cognito signup.
 * 
 * - Ignores insertion if the user profile already exists
 * 
 * @param credentials Database connection credentials
 * @param cognitoId Unique Cognito user ID (sub)
 * @param email User email address
 * @param name Display name for the user
 * @returns Created user profile or null if it already exists
 * @throws Error if the database query fails
 */
export async function createUserProfile(
  credentials: DbCredentials,
  cognitoId: string,
  email: string,
  name: string,
) {
  const query = `
    INSERT INTO users (cognito_id, email, name)
    VALUES ($1, $2, $3)
    ON CONFLICT (cognito_id) DO NOTHING
    RETURNING id, cognito_id, email, name, role, created_at;
  `;

  try {
    const result = await queryWithCreds(credentials, query, [
      cognitoId,
      email,
      name,
    ]);

    const user = result?.rows?.[0];

    if (user) {
      console.log(
        `User profile created: cognito_id=${cognitoId}`,
      );
    } else {
      console.log(
        `User profile already exists: cognito_id=${cognitoId}`,
      );
    }

    return user ?? null;
  } catch (error: any) {
    console.error("Internal Error creating user profile:", error);
    throw error;
  }
}