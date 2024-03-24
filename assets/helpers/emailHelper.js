import 'dotenv/config';
import { SMTPAddress } from "../../configs/emailConfigs.js";
const appDomain = process.env.APP_BRAND_DOMAIN

export function $sendEmail(to) {
    return {
        '@noreply': {
            async resetPassword(payload) {
                console.log(`[@] "Reset Password" email request: (${SMTPAddress.noreply.email} -> ${to})`);
                // -----------------------------------------------------------------
                const info = await SMTPAddress.noreply.transporter.sendMail({
                    from: `${appDomain} <${SMTPAddress.noreply.email}>`, // sender address
                    to, // list of receivers
                    subject: "Reset Password!", // Subject line
                    text: "Hello there, welcome to Faynn. Please Confirm your email address!", // plain text body
                    html: "<div><h1>Reset Password!</h1></div>"// html body
                });

                console.log("Message sent: %s", info.response);
                // -----------------------------------------------------------------                return null;
            },
            async confirmEmail(payload) {
                console.log(`[@] "Confirm Email" email request: (${SMTPAddress.noreply.email} -> ${to})`);
                // -----------------------------------------------------------------
                const info = await SMTPAddress.noreply.transporter.sendMail({
                    from: `${appDomain} <${SMTPAddress.noreply.email}>`, // sender address
                    to, // list of receivers
                    subject: "Confirm Email!", // Subject line
                    text: "Hello there, welcome to Faynn. Please Confirm your email address!", // plain text body
                    html: "<b>Hello world?</b>", // html body
                });

                console.log("Message sent: %s", info.response);
                // -----------------------------------------------------------------

                return info;
            },
        },
    }
}
