import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
export default sgMail;

// {
//     "from": "sender@yourdomain.com",
//     "template_id": "YOUR TEMPLATE ID",
//     "personalizations": [
//       {
//         "to": [
//           {
//             "email": "john@example.com"
//           }
//         ],
//         "send_at": 1600188812
//       },
//       {
//         "to": [
//           {
//             "email": "jane@example.com"
//           }
//         ],
//         "send_at": 1600275471
//       }
//     ]
//   }
  