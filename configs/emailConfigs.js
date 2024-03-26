import 'dotenv/config';
import nodemailer from "nodemailer";

let appDomain = process.env.APP_BRAND_DOMAIN.toLowerCase();
let appName = process.env.APP_BRAND_NAME;
export const SMTPAddress = {
    noreply: {
        //Typically used for automated emails where recipients are not expected to reply, such as newsletters, notifications, or confirmation emails.
        email: `noreply@${appDomain}`,
        default_from: `${appName} <noreply@${appDomain}>`,
        transporter: nodemailer.createTransport({
            host: process.env.SMTP_SERVER,
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        }),
    },
    info: {
        //Used for general inquiries, providing an easy-to-remember address for potential clients or partners.
        email: `info@${appDomain}`,
        default_from: `${appName} <info@${appDomain}>`,
        transporter: nodemailer.createTransport({
            host: process.env.SMTP_SERVER,
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    },
    support: {
        //Dedicated to customer support, helping users with their issues or questions regarding products or services.
        email: `support@${appDomain}`,
        default_from: `${appName} Support Team <support@${appDomain}>`,
        transporter: nodemailer.createTransport({
            host: process.env.SMTP_SERVER,
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    },
    admin: {
        //Used by the administrative department for various organizational tasks and communications.
        email: `admin@${appDomain}`,
        default_from: `Admin of ${process.env.APP_BRAND_DOMAIN} <admin@${appDomain}>`,
        transporter: nodemailer.createTransport({
            host: process.env.SMTP_SERVER,
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    },
    billing: {
        //For finance or billing-related queries, where customers can ask about invoices, payments, or account details.
        email: `billing@${appDomain}`,
        default_from: `${appName} Billing Service <billing@${appDomain}>`,
        transporter: nodemailer.createTransport({
            host: process.env.SMTP_SERVER,
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    },
    feedback: {
        //For collecting customer feedback, suggestions, or complaints to improve services or products.
        email: `feedback@${appDomain}`,
        default_from: `${appName} Feedback Service <feedback@${appDomain}>`,
        transporter: nodemailer.createTransport({
            host: process.env.SMTP_SERVER,
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    },
};

const emailTemplates = {};