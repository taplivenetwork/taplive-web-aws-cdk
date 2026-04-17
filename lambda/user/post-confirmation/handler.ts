import { createUserProfileFromCognito } from "./service";

exports.handler = async (event: any) => {
  try {
    const secretArn = process.env.DB_CREDENTIALS_SECRET_ARN;
    if (!secretArn) throw new Error("DB_CREDENTIALS_SECRET_ARN is not defined");

    const { userAttributes } = event.request;
    const cognito_id = userAttributes.sub;
    const email = userAttributes.email;
    const name =
      userAttributes["custom:name"] || userAttributes.email.split("@")[0];

    await createUserProfileFromCognito(cognito_id, email, name, secretArn);

    return event;
  } catch (error) {
    console.error("PostConfirmation handler error:", error);
    // throw new Error("Failed to create user profile");
    return event;
  }
};
