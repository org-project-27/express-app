import 'dotenv/config';
import {SMTPAddress} from "../../configs/emailConfigs";
import {promises as fs} from 'fs';
import {fileURLToPath} from 'url';
import path from 'path';
import {default_email_lang} from "../constants/language";
const appDomain: any = process.env.APP_BRAND_DOMAIN;
const company_name: any = process.env.APP_BRAND_NAME;
export function $sendEmail(to: any, lang: any = default_email_lang) {
    return {
        '@noreply': {
            async resetPassword(payload: any = { full_name: null, reset_link: null, reset_link_life_hour: null }) {
                console.log(`[@] "Reset Password" email request: (${SMTPAddress.noreply.email} -> ${to})`);
                // -----------------------------------------------------------------
                const { full_name, reset_link, reset_link_life_hour } = payload;
                const sentEmail = await SMTPAddress.noreply.transporter.sendMail({
                    from: `${appDomain} <${SMTPAddress.noreply.email}>`,
                    to,
                    subject: "Reset Password",
                    text: "Hello there, here the link for reset your password!",
                    html: await getEmailTemplate('reset_password', {
                        reset_link,
                        full_name,
                        company_name,
                        reset_link_life_hour,
                        support_team_email: SMTPAddress.support.email,
                    }, lang),
                });
                console.log("Message sent: %s", sentEmail.response);
                // -----------------------------------------------------------------
                return sentEmail;
            },
            async confirmEmail(payload: any = { full_name: null, confirm_link: null, confirm_link_life_hour: 24}) {
                console.log(`[@] "Confirm Email" email request: (${SMTPAddress.noreply.email} -> ${to})`);
                // -----------------------------------------------------------------
                const { full_name, confirm_link, confirm_link_life_hour } = payload;
                const sentEmail = await SMTPAddress.noreply.transporter.sendMail({
                    from: `${appDomain} <${SMTPAddress.noreply.email}>`,
                    to,
                    subject: "Confirm Email",
                    text: "Hello there, welcome to Faynn. Please Confirm your email address!",
                    html: await getEmailTemplate('confirm_email', {
                        support_team_email: SMTPAddress.support.email,
                        company_name,
                        full_name,
                        confirm_link,
                        confirm_link_life_hour
                    }, lang),
                });

                console.log("Message sent: %s", sentEmail.response);
                // -----------------------------------------------------------------
                return sentEmail;
            },
            async passwordUpdated( payload: any = { full_name: null, update_date: null, browser: null, os: null, platform: null  }){
                console.log(`[@] "Password Updated" email request: (${SMTPAddress.noreply.email} -> ${to})`);
                // -----------------------------------------------------------------
                const { full_name, update_date, browser, os, platform } = payload;
                const sentEmail = await SMTPAddress.noreply.transporter.sendMail({
                    from: `${appDomain} <${SMTPAddress.noreply.email}>`,
                    to,
                    subject: "Password Updated",
                    text: "Your password been successfully updated!",
                    html: await getEmailTemplate('password_updated', {
                        support_team_email: SMTPAddress.support.email,
                        company_name,
                        full_name,
                        update_date,
                        browser,
                        platform,
                        os,
                    }, lang),
                });

                console.log("Message sent: %s", sentEmail.response);
                // -----------------------------------------------------------------
                return sentEmail;
            }
        },
    }
}

export async function getEmailTemplate(template_name: any, values: any = {}, lang = default_email_lang){
    values['logo_url'] = `${appDomain.toLowerCase()}/logo.png`
    let templateContent: any = '<strong> Null content </strong>';
    try {
        const filePath = path.join(__dirname, `../../views/email_templates/${lang || default_email_lang}/${template_name}.html`);
        templateContent = await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error('Error reading the HTML file', error);
    }

    Object.entries(values).forEach(([key, value]) => {
        templateContent = templateContent.replaceAll(`$${key}$`, `${value || null}`);
    });

    return templateContent;
}