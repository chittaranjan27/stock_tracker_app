import nodemailer from "nodemailer";
import path from 'path';
import { WELCOME_EMAIL_TEMPLATE } from "./templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
});

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    let htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro)
        .replace(/src="[^"]*Group\.png[^"]*"/g, 'src="cid:group_logo" width="25" height="auto"');

    const logoPath = path.resolve(process.cwd(), 'public', 'assets', 'icons', 'Group.png');

    const mailOptions = {
        from: `"TradeX" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: 'Welcome to TradeX - your stock market toolkit is ready!',
        html: htmlTemplate,
        attachments: [
            {
                filename: 'Group.png',
                path: logoPath,
                cid: 'group_logo'
            }
        ]
    };

    await transporter.sendMail(mailOptions);
};