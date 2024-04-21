import 'dotenv/config';
import {SMTPAddress} from "../../configs/emailConfigs.js";
import {promises as fs} from 'fs';
import {fileURLToPath} from 'url';
import path from 'path';

const appDomain = process.env.APP_BRAND_DOMAIN;
const company_name = process.env.APP_BRAND_NAME;
export function $sendEmail(to) {
    return {
        '@noreply': {
            async resetPassword(payload) {
                console.log(`[@] "Reset Password" email request: (${SMTPAddress.noreply.email} -> ${to})`);
                // -----------------------------------------------------------------
                const info = await SMTPAddress.noreply.transporter.sendMail({
                    from: `${appDomain} <${SMTPAddress.noreply.email}>`,
                    to,
                    subject: "Reset Password!",
                text: "Hello there, here the link for reset your password!",
                    html: await getEmailTemplate('reset_password', {
                        full_name: 'Vugar Safarzada',
                        reset_password_link_title: 'Click Link',
                        reset_password_link: 'faynn.com/getstarted?view=forgot_password'
                    }),
                });
                console.log("Message sent: %s", info.response);
                // -----------------------------------------------------------------
                return null;
            },
            async confirmEmail(payload = { full_name: null, confirm_link: null, confirm_link_life_hour: 24}) {
                console.log(`[@] "Confirm Email" email request: (${SMTPAddress.noreply.email} -> ${to})`);
                // -----------------------------------------------------------------
                const { full_name, confirm_link, confirm_link_life_hour } = payload;
                const info = await SMTPAddress.noreply.transporter.sendMail({
                    from: `${appDomain} <${SMTPAddress.noreply.email}>`,
                    to,
                    subject: "Confirm Email!",
                    text: "Hello there, welcome to Faynn. Please Confirm your email address!",
                    html: await getEmailTemplate('confirm_email', {
                        support_team_email: SMTPAddress.support.email,
                        company_name,
                        full_name,
                        confirm_link,
                        confirm_link_label: 'Confirm Email',
                        confirm_link_life_hour
                    }),
                });

                console.log("Message sent: %s", info.response);
                // -----------------------------------------------------------------
                return info;
            },
        },
    }
}

export async function getEmailTemplate(template_name, values = {}){
    const lang = 'en';
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    let templateContent = '<strong> Null content </strong>';
    try {
        const filePath = path.join(__dirname, `../../views/email_templates/${lang}/${template_name}.html`);
        templateContent = await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error('Error reading the HTML file', error);
    }

    Object.entries(values).forEach(([key, value]) => {
        templateContent = templateContent.replaceAll(`$${key}$`, `${value || null}`);
    });

    return templateContent;
}