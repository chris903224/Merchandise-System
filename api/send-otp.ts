// api/send-otp.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup para sa localhost
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Missing email or OTP' });
  }

  try {
    // 🚨 Setup SMTP (Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"SJCM Admin" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'SJCM Admin Console - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Admin Console Access</h2>
          <p>Your OTP code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 8px; color: #2ecc71;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    // 🚨 I-handle ang unknown type para sa error
    console.error('SMTP Error:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ error: message });
  }
}