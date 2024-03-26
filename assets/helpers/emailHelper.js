import 'dotenv/config';
import { SMTPAddress } from "../../configs/emailConfigs.js";
const appDomain = process.env.APP_BRAND_DOMAIN

export function $sendEmail(to) {
    return {
        '@noreply': {
            async resetPassword(payload) {
                // -----------------------------------------------------------------
                const email = await SMTPAddress.noreply.transporter.sendMail({
                    from: SMTPAddress.noreply.default_from,
                    to,
                    subject: "Reset Password!",
                    text: "Hello there, welcome to Faynn. Please Confirm your email address!",
                    html: "<div><h1>Reset Password!</h1></div>"
                });

                console.log(`[@] "Reset Password" email request: (${SMTPAddress.noreply.email} -> ${to})`);
                console.log("Email sent: %s", email.response);
                // -----------------------------------------------------------------
                return email;
            },
            async confirmEmail(payload) {
                // -----------------------------------------------------------------
                const email = await SMTPAddress.noreply.transporter.sendMail({
                    from: `${appDomain} <${SMTPAddress.noreply.email}>`,
                    to,
                    subject: "Confirm Email!",
                    text: "Hello there, welcome to Faynn. Please Confirm your email address!",
                    html: "<b>Hello world?</b>",
                });

                console.log(`[@] "Confirm Email" email request: (${SMTPAddress.noreply.email} -> ${to})`);
                console.log("Email sent: %s", email.response);
                // -----------------------------------------------------------------
                return email;
            },
        },
    }
}
