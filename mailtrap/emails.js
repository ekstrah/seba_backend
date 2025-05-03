import { VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js"
import { mailtrapClient, sender} from "./mailtrap.config.js"

export const sendVerificationEmail = async (email, verificationToken) => {
    const recepient = [{ email }]

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recepient,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification"
        })
    } catch (error) {
        console.error(`Error sending verification`, error);
        throw new Error(`Error sending verification email: ${error}`);

    }
}

export const sendWelcomeEmail = async (email, name) => {
    const recipients = [{email}];
    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipients,
            template_uuid: "eee83ead-5e6d-4784-bd67-c7296f4649b5",
            template_variables: {
                "company_info_name": "Ai Laplace Lab",
                "name": name,
                "company_info_address": "Rinstraße 19C",
                "company_info_city": "Schwabhausen",
                "company_info_zip_code": "85247",
                "company_info_country": "Germany"
            },
        });
		console.log("Welcome email sent successfully", response);
	} catch (error) {
		console.error(`Error sending welcome email`, error);

		throw new Error(`Error sending welcome email: ${error}`);
    }
};