import { Resend } from 'resend';
import { env } from '../../config/env';

const resend = new Resend(env.RESEND_API_KEY);
console.log('RESEND KEY LOADED:', env.RESEND_API_KEY ? `yes, starts with ${env.RESEND_API_KEY.slice(0, 6)}` : 'MISSING');
const FROM_EMAIL = 'ShopFair <no-reply@shopaffair.shop>';

export const sendOtpEmail = async (params: {
  to: string;
  code: string;
  purpose: 'signup' | 'reset';
}) => {
  const { to, code, purpose } = params;

  const subject =
    purpose === 'signup'
      ? 'Verify your ShopFair email'
      : 'Reset your ShopFair password';

  const heading =
    purpose === 'signup'
      ? 'Verify your email'
      : 'Reset your password';

  const body =
    purpose === 'signup'
      ? 'Use the code below to verify your email and finish creating your ShopFair account.'
      : 'Use the code below to reset your ShopFair password.';
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>${heading}</h2>
        <p>${body}</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 24px 0;">
          ${code}
        </p>
        <p style="color: #666; font-size: 13px;">
          This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `
  });

  console.log('Resend response:', { data, error });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};