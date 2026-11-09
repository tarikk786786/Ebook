/**
 * AnonTrove Editorial Email Marketing & Automation Templates
 * Clean, lightweight, professional HTML/Text templates matching AnonTrove's warm editorial identity.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function generateWelcomeEmail(customerEmail: string, freeSampleTitle?: string, downloadUrl?: string): EmailPayload {
  const sampleTitle = freeSampleTitle || "Software Engineering Principles & System Architecture Primer";
  const url = downloadUrl || "https://ebook-sandy-chi.vercel.app/library";

  const subject = "Welcome to AnonTrove — Your Free Study Primer is Inside";
  const text = `Welcome to AnonTrove,

Thank you for joining our independent publishing circle. We are dedicated to curating high-signal technical literature without bloated subscription fees.

Here is your complimentary digital study guide:
${sampleTitle}
Access link: ${url}

All AnonTrove titles are 100% DRM-free in universal PDF format. You can read them on your Kindle, laptop, or phone, or directly in our zero-install in-browser reader.

Warm regards,
AnonTrove Editorial Guild
https://ebook-sandy-chi.vercel.app/`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; background-color: #F7F5F0; color: #24231F; margin: 0; padding: 40px 20px; line-height: 1.6; }
    .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E8E4DC; border-radius: 6px; padding: 40px; }
    .header { border-bottom: 1px solid #E8E4DC; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: bold; color: #24231F; letter-spacing: -0.5px; }
    .subtitle { font-size: 11px; text-transform: uppercase; color: #81796D; font-family: -apple-system, sans-serif; letter-spacing: 1px; }
    .card { background: #FAF8F5; border: 1px solid #E8E4DC; border-radius: 6px; padding: 20px; margin: 24px 0; }
    .button { display: inline-block; background: #24231F; color: #FFFFFF !important; text-decoration: none; padding: 12px 24px; font-size: 13px; font-family: -apple-system, sans-serif; font-weight: 600; border-radius: 4px; }
    .footer { font-size: 11px; color: #81796D; font-family: -apple-system, sans-serif; border-top: 1px solid #E8E4DC; padding-top: 20px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">AnonTrove</div>
      <div class="subtitle">Independent Digital Publishing</div>
    </div>
    
    <h2 style="font-size: 20px; margin-top: 0;">Welcome to our reader community.</h2>
    <p>Thank you for subscribing. We curate over 12,192 verified digital books, technical manuals, and computer science textbooks for lifelong practitioners.</p>
    
    <div class="card">
      <div style="font-size: 11px; text-transform: uppercase; color: #9A704B; font-weight: bold; font-family: -apple-system, sans-serif;">Complimentary Guide</div>
      <h3 style="margin: 8px 0 12px 0; font-size: 16px;">${sampleTitle}</h3>
      <p style="font-size: 13px; color: #5B5449; margin: 0 0 16px 0;">Universal DRM-free PDF ready for immediate reading on any device.</p>
      <a href="${url}" class="button">Download Your Free Guide</a>
    </div>

    <p style="font-size: 13px; color: #5B5449;">Every book purchased at AnonTrove gives you lifetime download rights and instant zero-install access via our in-browser reader.</p>

    <div class="footer">
      You received this because you subscribed at AnonTrove. <br/>
      AnonTrove Publishing • 100% Privacy Respecting • No Spam Guaranteed
    </div>
  </div>
</body>
</html>`;

  return { to: customerEmail, subject, text, html };
}

export function generatePurchaseReceiptEmail(customerEmail: string, orderNumber: string, bookTitles: string[], downloadToken: string): EmailPayload {
  const downloadUrl = `https://ebook-sandy-chi.vercel.app/api/download/${downloadToken}`;
  const readerUrl = `https://ebook-sandy-chi.vercel.app/reader/${downloadToken}`;

  const subject = `Your AnonTrove Order #${orderNumber} — Instant Download Ready`;
  const text = `Thank you for your purchase from AnonTrove!

Order Number: ${orderNumber}
Items Purchased:
${bookTitles.map(t => `- ${t}`).join('\n')}

Download your DRM-free PDF files:
${downloadUrl}

Or read immediately in your browser:
${readerUrl}

Your download link is cryptographically authenticated. Save your files to your local drive for permanent offline access.

Need help? Contact apnix7@gmail.com
Warm regards,
AnonTrove Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; background-color: #F7F5F0; color: #24231F; margin: 0; padding: 40px 20px; line-height: 1.6; }
    .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E8E4DC; border-radius: 6px; padding: 40px; }
    .header { border-bottom: 1px solid #E8E4DC; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: bold; color: #24231F; }
    .order-box { background: #FAF8F5; border: 1px solid #E8E4DC; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; background: #24231F; color: #FFFFFF !important; text-decoration: none; padding: 12px 24px; font-size: 13px; font-family: -apple-system, sans-serif; font-weight: 600; border-radius: 4px; margin-right: 10px; margin-bottom: 10px; }
    .btn-secondary { background: #FAF8F5; color: #24231F !important; border: 1px solid #E8E4DC; }
    .footer { font-size: 11px; color: #81796D; font-family: -apple-system, sans-serif; border-top: 1px solid #E8E4DC; padding-top: 20px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">AnonTrove</div>
      <div style="font-size: 12px; color: #81796D; font-family: -apple-system, sans-serif;">Order Receipt #${orderNumber}</div>
    </div>
    
    <h2 style="font-size: 20px; margin-top: 0;">Your digital books are ready.</h2>
    <p>Thank you for supporting independent technical publishing. Your order is confirmed and available for immediate retrieval.</p>
    
    <div class="order-box">
      <div style="font-size: 12px; font-weight: bold; color: #5B5449; font-family: -apple-system, sans-serif; margin-bottom: 8px;">Order Summary:</div>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
        ${bookTitles.map(t => `<li style="margin-bottom: 4px;"><strong>${t}</strong> (DRM-Free PDF)</li>`).join('')}
      </ul>
    </div>

    <div style="margin: 24px 0;">
      <a href="${downloadUrl}" class="btn">Download Ebook (PDF)</a>
      <a href="${readerUrl}" class="btn btn-secondary">Open In-Browser Reader</a>
    </div>

    <p style="font-size: 12px; color: #81796D; font-family: -apple-system, sans-serif;">
      <strong>Note:</strong> Download tokens are cryptographically signed. We recommend saving copies to your personal laptop or cloud drive.
    </p>

    <div class="footer">
      AnonTrove Digital Bookstore • Questions? Contact apnix7@gmail.com
    </div>
  </div>
</body>
</html>`;

  return { to: customerEmail, subject, text, html };
}

export function generateAbandonedCartEmail(customerEmail: string, bookTitle: string, bookSlug: string, priceInInr: number): EmailPayload {
  const checkoutUrl = `https://ebook-sandy-chi.vercel.app/book/${bookSlug}`;

  const subject = `Still interested in reading "${bookTitle}"?`;
  const text = `Hello,

We noticed you left "${bookTitle}" in your reading bag at AnonTrove.

You can complete your order for ₹${priceInInr} and get instant DRM-free PDF access:
${checkoutUrl}

If you have any questions regarding file compatibility, table of contents, or formats, simply reply to this email.

Warm regards,
AnonTrove Editorial`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; background-color: #F7F5F0; color: #24231F; margin: 0; padding: 40px 20px; line-height: 1.6; }
    .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E8E4DC; border-radius: 6px; padding: 40px; }
    .btn { display: inline-block; background: #24231F; color: #FFFFFF !important; text-decoration: none; padding: 12px 24px; font-size: 13px; font-family: -apple-system, sans-serif; font-weight: 600; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h2 style="font-size: 20px; margin-top: 0;">Continue reading ${bookTitle}?</h2>
    <p>Your selection is saved in your reading bag. Complete your purchase for ₹${priceInInr} with instant UPI/Card checkout.</p>
    <div style="margin: 24px 0;">
      <a href="${checkoutUrl}" class="btn">Resume Order (₹${priceInInr})</a>
    </div>
    <p style="font-size: 12px; color: #81796D;">No subscriptions. No recurring charges. 100% DRM-free.</p>
  </div>
</body>
</html>`;

  return { to: customerEmail, subject, text, html };
}
