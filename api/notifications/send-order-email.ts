// app/api/notifications/send-order-email.ts

export const config = { runtime: 'nodejs' };

/* ============================================================
   ✅ TYPES
   ============================================================ */

type EmailPayload = {
  orderId: string;
  orderCode: string;
  userId: string;
  email: string;
  customerName: string;
  template: string;
  previousStatus?: string;
  newStatus: string;
  claimLocation?: string;
};

/* ✅ Brevo API response */
type BrevoResponse = {
  messageId?: string;
  message?: string;
  code?: string;
};

/* ============================================================
   TEMPLATE RENDERER
   ============================================================ */

function renderEmail(
  template: string,
  data: EmailPayload
): { subject: string; html: string } {
  const { orderCode, customerName, claimLocation } = data;

  const templates: Record<string, { subject: string; html: string }> = {
    order_confirmed: {
      subject: `✅ Order Confirmed — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> has been received and is now pending.</p>
          <p>We'll notify you once it's ready for pickup.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
    order_processing: {
      subject: `⏳ Order Being Processed — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> is now being processed.</p>
          <p>We'll notify you once it's ready.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
    order_ready_pickup: {
      subject: `📦 Ready for Pickup — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> is now ready for pickup!</p>
          <p><strong>Pickup Location:</strong> ${claimLocation || 'SJCM Supply Office'}</p>
          <p>Please bring a valid school ID.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
    order_out_for_delivery: {
      subject: `🚚 Out for Delivery — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> is now out for delivery.</p>
          <p><strong>Delivery to:</strong> ${claimLocation || 'Your registered address'}</p>
          <p>Please be available to receive it.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
    order_completed: {
      subject: `✨ Order Completed — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> is now complete. Thank you!</p>
          <p>We hope to serve you again soon.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
    order_cancelled: {
      subject: `❌ Order Cancelled — ${orderCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p>Your order <strong>${orderCode}</strong> has been cancelled.</p>
          <p>If you have questions, please contact the supply office.</p>
          <p style="margin-top: 24px; color: #666;">— SJCM Store Team</p>
        </div>
      `,
    },
  };

  return templates[template] ?? {
    subject: `Order Update — ${orderCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hi ${customerName},</h2>
        <p>Your order status has been updated.</p>
        <p>— SJCM Store Team</p>
      </div>
    `,
  };
}

/* ============================================================
   HANDLER — BREVO
   ============================================================ */

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const payload: EmailPayload = req.body;

    console.log('[Email API] Received:', {
      orderCode: payload.orderCode,
      template: payload.template,
      to: payload.email,
    });

    if (!payload.email || !payload.template || !payload.orderCode) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
    const BREVO_SENDER_NAME =
      process.env.BREVO_SENDER_NAME || 'SJCM Store';

    if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
      console.error('[Email API] ❌ Missing Brevo config');
      return res
        .status(500)
        .json({ message: 'Email service not configured' });
    }

    const { subject, html } = renderEmail(payload.template, payload);

    /* ✅ Send via Brevo */
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: BREVO_SENDER_EMAIL,
          name: BREVO_SENDER_NAME,
        },
        to: [
          {
            email: payload.email,
            name: payload.customerName,
          },
        ],
        subject,
        htmlContent: html,
      }),
    });

    const json = (await brevoRes.json()) as BrevoResponse;

    if (!brevoRes.ok) {
      console.error('[Email API] ❌ Brevo error:', json);
      return res.status(brevoRes.status).json({
        message: json.message || 'Email send failed',
        error: json,
      });
    }

    console.log('[Email API] ✅ Sent via Brevo:', json.messageId);
    return res.status(200).json({ success: true, id: json.messageId });
  } catch (error: any) {
    console.error('[Email API] ❌ Error:', error);
    return res.status(500).json({ message: error.message });
  }
}