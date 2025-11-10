import nodemailer from "nodemailer";
import path from "path";
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from "./templates";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

const embedLogo = (htmlTemplate: string): { html: string; attachments: any[] } => {
  const logoPath = path.resolve(process.cwd(), "public", "assets", "icons", "Group.png");

  const brandHeader = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="middle" style="padding-right:10px;">
          <img 
            src="cid:group_logo" 
            alt="tradeX Logo" 
            width="30" 
            height="30" 
            style="display:block;border:none;outline:none;text-decoration:none;vertical-align:middle;"
          />
        </td>
        <td valign="middle">
          <span style="font-size:22px;font-weight:700;color:#FDD458;font-family:Arial,Helvetica,sans-serif;">
            tradeX
          </span>
        </td>
      </tr>
    </table>
  `;

  const updatedHtml = htmlTemplate.includes("Group.png")
    ? htmlTemplate.replace(/<img[^>]*Group\.png[^>]*>/g, brandHeader)
    : htmlTemplate.replace(/<h1/i, `${brandHeader}<h1`);

  return {
    html: updatedHtml,
    attachments: [
      {
        filename: "Group.png",
        path: logoPath,
        cid: "group_logo",
      },
    ],
  };
};

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  let htmlTemplate = WELCOME_EMAIL_TEMPLATE
    .replace("{{name}}", name)
    .replace("{{intro}}", intro);

  const { html, attachments } = embedLogo(htmlTemplate);

  const mailOptions = {
    from: `"tradeX" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: "Welcome to tradeX - your stock market toolkit is ready!",
    html,
    attachments,
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  let htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
    .replace("{{date}}", date)
    .replace("{{newsContent}}", newsContent);

  const { html, attachments } = embedLogo(htmlTemplate);

  const mailOptions = {
    from: `"tradeX News" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `📈 Market News Summary Today - ${date}`,
    text: `Today's market news summary from tradeX`,
    html,
    attachments,
  };

  await transporter.sendMail(mailOptions);
};
