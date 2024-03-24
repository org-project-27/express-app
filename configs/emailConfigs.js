import 'dotenv/config';
import nodemailer from "nodemailer";

let appDomain = process.env.APP_BRAND_DOMAIN.toLowerCase();

export const SMTPAddress = {
    noreply: {
        //Typically used for automated emails where recipients are not expected to reply, such as newsletters, notifications, or confirmation emails.
        email: `noreply@${appDomain}`,
        transporter: nodemailer.createTransport({
            host: process.env.AWS_SES_SMTP_SERVER,
            port: 587,
            secure: false,
            auth: {
                user: process.env.AWS_SES_SMTP_USER,
                pass: process.env.AWS_SES_SMTP_PASS
            }
        }),
    },
    info: {
        //Used for general inquiries, providing an easy-to-remember address for potential clients or partners.
        email: `info@${appDomain}`,
        transporter: nodemailer.createTransport({
            host: null,
            port: null,
            secure: false,
            auth: {
                user: null,
                pass: null
            }
        })
    },
    support: {
        //Dedicated to customer support, helping users with their issues or questions regarding products or services.
        email: `support@${appDomain}`,
        transporter: nodemailer.createTransport({
            host: null,
            port: null,
            secure: false,
            auth: {
                user: null,
                pass: null
            }
        })
    },
    sales: {
        //Focused on sales inquiries, where potential customers can get more information about products or services.
        email: `sales@${appDomain}`,
        transporter: nodemailer.createTransport({
            host: null,
            port: null,
            secure: false,
            auth: {
                user: null,
                pass: null
            }
        })
    },
    hr: {
        //For human resources, where job applicants or employees can send their resumes or inquire about HR-related matters.
        email: `hr@${appDomain}`,
        transporter: nodemailer.createTransport({
            host: null,
            port: null,
            secure: false,
            auth: {
                user: null,
                pass: null
            }
        })
    },
    admin: {
        //Used by the administrative department for various organizational tasks and communications.
        email: `admin@${appDomain}`,
        transporter: nodemailer.createTransport({
            host: null,
            port: null,
            secure: false,
            auth: {
                user: null,
                pass: null
            }
        })
    },
    marketing: {
        //For the marketing team, where they handle marketing-related communications, campaigns, and inquiries.
        email: `marketing@${appDomain}`,
        transporter: nodemailer.createTransport({
            host: null,
            port: null,
            secure: false,
            auth: {
                user: null,
                pass: null
            }
        })
    },
    billing: {
        //For finance or billing-related queries, where customers can ask about invoices, payments, or account details.
        email: `billing@${appDomain}`,
        transporter: nodemailer.createTransport({
            host: null,
            port: null,
            secure: false,
            auth: {
                user: null,
                pass: null
            }
        })
    },
    tech: {
        //For technical support or IT-related issues, where users can report problems or seek assistance with technical products.
        email: `tech@${appDomain}`,
        transporter: nodemailer.createTransport({
            host: null,
            port: null,
            secure: false,
            auth: {
                user: null,
                pass: null
            }
        })
    },
    feedback: {
        //For collecting customer feedback, suggestions, or complaints to improve services or products.
        email: `feedback@${appDomain}`,
        transporter: nodemailer.createTransport({
            host: null,
            port: null,
            secure: false,
            auth: {
                user: null,
                pass: null
            }
        })
    },
};

const emailTemplates = {}

// const transporter = nodemailer.createTransport({
//     host: 'smtp.ethereal.email',
//     port: 587,
//     secure: false, // Use `true` for port 465, `false` for all other ports
//     auth: {
//         user: 'kaleb58@ethereal.email',
//         pass: 'nP3yf2b2YwazgnmVvj'
//     }
// });
//
// // async..await is not allowed in global scope, must use a wrapper
// async function main() {
//     // send mail with defined transport object
//     const info = await transporter.sendMail({
//         from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>', // sender address
//         to: "vuqarsfrzad@gmail.com, kixeha3161@shaflyn.com", // list of receivers
//         subject: "Hello ✔", // Subject line
//         text: "Hello world?", // plain text body
//         html: "<b>Hello world?</b>", // html body
//     });
//
//     console.log("Message sent: %s", info.messageId);
//     // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
// }

// main().catch(console.error); // for send email