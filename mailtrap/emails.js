import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import { /*mailtrapClient,*/ resend, sender } from "./mailtrap.config.js";

export const sendVerificationEmail = async (
  email,
  verificationToken,
  firstName
) => {
  const recipient = [{ email }];

  try {
    const response = await resend.emails.send({
      /*if u wanna go back to mailtrap, subsitute resend.emails with mailtrapClient.send */
      from: sender,
      to: email /*for mailtrop put recipient */,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace("{name}", firstName).replace(
        "{verificationCode}",
        verificationToken
      ),

      //category: "Email Verification",
    });

    console.log("Email sent successfully", response);
  } catch (error) {
    console.error(`Error sending verification`, error);

    throw new Error(`Error sending verification email: ${error}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const recipient = [{ email }];

  try {
    const response = await resend.emails.send({
      from: sender,
      to: email,
      subject: "Welcome to fitLynq",
      html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name),
      category: "Welcome",
    });

    console.log("Welcome email sent successfully", response);
  } catch (error) {
    console.error(`Error sending welcome email`, error);

    throw new Error(`Error sending welcome email: ${error}`);
  }
};

export const sendPasswordResetEmail = async (email, name, resetURL) => {
  const recipient = [{ email }];

  try {
    const response = await resend.emails.send({
      from: sender,
      to: email,
      subject: "Reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{name}", name).replace(
        "{resetURL}",
        resetURL
      ),
      category: "Password Reset",
    });
  } catch (error) {
    console.error(`Error sending password reset email`, error);

    throw new Error(`Error sending password reset email: ${error}`);
  }
};

export const sendResetSuccessEmail = async (email) => {
  const recipient = [{ email }];

  try {
    const response = await resend.emails.send({
      from: sender,
      to: email,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset",
    });

    console.log("Password reset email sent successfully", response);
  } catch (error) {
    console.error(`Error sending password reset success email`, error);

    throw new Error(`Error sending password reset success email: ${error}`);
  }
};
