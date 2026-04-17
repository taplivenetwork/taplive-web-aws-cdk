import { createUserProfileFromCognito } from "./service";

exports.handler = async (event: any) => {
  try {
    const { userAttributes } = event.request;
    const cognito_id = userAttributes.sub;
    const email = userAttributes.email;
    const name =
      userAttributes["custom:name"] || userAttributes.email.split("@")[0];

    await createUserProfileFromCognito(cognito_id, email, name);

    return event;
  } catch (error) {
    console.error("PostConfirmation handler error:", error);
    throw new Error("Failed to create user profile");
  }
};
