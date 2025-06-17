import {
	PASSWORD_RESET_REQUEST_TEMPLATE,
	PASSWORD_RESET_SUCCESS_TEMPLATE,
	VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import { mailtrapClient, sender } from "./mailtrap.config.js";

export const sendVerificationEmail = async (email, verificationToken) => {
	const recepient = [{ email }];

	try {
		await mailtrapClient.send({
			from: sender,
			to: recepient,
			subject: "Verify your email",
			html: VERIFICATION_EMAIL_TEMPLATE.replace(
				"{verificationCode}",
				verificationToken,
			),
			category: "Email Verification",
		});
	} catch (error) {
		console.error("Error sending verification", error);
		throw new Error("Error sending verification email: ${error}");
	}
};

export const sendWelcomeEmail = async (email, name) => {
	const recipients = [{ email }];
	try {
		const response = await mailtrapClient.send({
			from: sender,
			to: recipients,
			template_uuid: "eee83ead-5e6d-4784-bd67-c7296f4649b5",
			template_variables: {
				company_info_name: "Ai Laplace Lab",
				name: name,
				company_info_address: "Rinstraße 19C",
				company_info_city: "Schwabhausen",
				company_info_zip_code: "85247",
				company_info_country: "Germany",
			},
		});
		console.log("Welcome email sent successfully", response);
	} catch (error) {
		console.error("Error sending welcome email", error);

		throw new Error(`Error sending welcome email: ${error}`);
	}
};

export const sendPasswordResetEmail = async (email, resetURL) => {
	const recipient = [{ email }];
	try {
		await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Rset Your Password",
			html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
			category: "Password Reset",
		});
	} catch (error) {
		console.error("Error sending password reset email", error);

		throw new Error("Error sending password reset email: ${error}");
	}
};

export const sendResetSucessEmail = async (email) => {
	const recipient = [{ email }];

	try {
		const response = await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Password reset Sucessfull",
			html: PASSWORD_RESET_SUCCESS_TEMPLATE,
			category: "Password Reset",
		});
		console.log("Password reset email sent sucessfully", response);
	} catch (error) {
		console.log("Error sending password reset sucess email", error);

		throw new Error("Error sending password reset sucess email: ${error}");
	}
};
