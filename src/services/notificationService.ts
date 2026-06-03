import nodemailer from 'nodemailer';
import { Telegraf } from 'telegraf';

// --- Gmail Configuration ---
// We use a singleton pattern to reuse the transporter connection
let transporter: nodemailer.Transporter | null = null;

const cleanEnv = (val: string | undefined): string => 
  val ? val.replace(/^["']|["']$/g, '').trim() : '';

function getTransporter() {
  if (!transporter) {
    const user = cleanEnv(process.env.GMAIL_USER);
    const pass = cleanEnv(process.env.GMAIL_APP_PASSWORD);

    if (!user || !pass) {
      console.warn("⚠️ Gmail credentials missing (GMAIL_USER and/or GMAIL_APP_PASSWORD). Email notifications are disabled.");
      return null;
    }

    console.log(`🔌 Initializing Nodemailer transporter for user: ${user}`);
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }
  return transporter;
}

// --- Telegram Configuration ---
let bot: Telegraf | null = null;

function getTelegramBot() {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn("Telegram Bot Token missing. Telegram notifications are disabled.");
      return null;
    }
    bot = new Telegraf(token);
  }
  return bot;
}

// --- Notification Service ---
export const NotificationService = {
  
  async sendOrderNotification(orderData: any, items: any[]) {
    const { 
      id, 
      full_name, 
      phone_number, 
      delivery_address, 
      landmark, 
      total_amount, 
      payment_method, 
      payment_receipt_url,
      distributor_id 
    } = orderData;

    // Format the items list
    let itemsList = '';
    const packages = new Map<string, any[]>();
    const singleProducts: any[] = [];

    items.forEach(item => {
      if (item.is_package && item.package_name) {
        if (!packages.has(item.package_name)) {
          packages.set(item.package_name, []);
        }
        packages.get(item.package_name)!.push(item);
      } else {
        singleProducts.push(item);
      }
    });

    packages.forEach((pkgItems, pkgName) => {
      const pkgQuantity = pkgItems[0].quantity || 1;
      const pkgPrice = pkgItems[0].package_price || pkgItems.reduce((sum, p) => sum + (p.price_at_time || 0), 0);
      itemsList += `- ${pkgQuantity}x ${pkgName} (₦${(pkgPrice * pkgQuantity).toLocaleString()})\n`;
      pkgItems.forEach(p => {
        itemsList += `    ↳ ${p.name || 'Product'}\n`;
      });
    });

    singleProducts.forEach(item => {
      const price = item.price_at_time || item.price_naira || 0;
      itemsList += `- ${item.quantity || 1}x ${item.name || 'Product'} (₦${(price * (item.quantity || 1)).toLocaleString()})\n`;
    });

    itemsList = itemsList.trim();

    // Create a clean, readable message body
    const messageBody = `
🚨 NEW ORDER RECEIVED! 🚨

Order ID: #${id.slice(0, 8).toUpperCase()}
Total Amount: ₦${total_amount.toLocaleString()}
Payment Method: ${payment_method.toUpperCase()}
${payment_receipt_url ? `Receipt URL: ${payment_receipt_url}\n` : ''}Distributor ID: ${distributor_id || 'N/A'}

👤 CUSTOMER DETAILS:
Name: ${full_name}
Phone: ${phone_number}

📍 DELIVERY ADDRESS:
${delivery_address}
${landmark ? `Landmark: ${landmark}` : ''}

📦 ORDER ITEMS:
${itemsList}

Please check the Admin Dashboard to process this order.
    `.trim();

    // 1. Send via Telegram (Fastest)
    try {
      const tgBot = getTelegramBot();
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      if (tgBot && chatId) {
        await tgBot.telegram.sendMessage(chatId, messageBody);
        console.log("✅ Telegram notification sent successfully.");
      }
    } catch (error) {
      console.error("❌ Failed to send Telegram notification:", error);
    }

    // 2. Send via Gmail (Reliable Backup/Record)
    try {
      const mailer = getTransporter();
      const rawToEmail = process.env.NOTIFICATION_EMAIL_TO || process.env.GMAIL_USER;
      const toEmail = cleanEnv(rawToEmail);
      const cleanUser = cleanEnv(process.env.GMAIL_USER);
      
      if (mailer && toEmail) {
        const mailOptions: any = {
          from: `"SD GHT Orders" <${cleanUser}>`,
          to: toEmail,
          subject: `🚨 New Order: ₦${total_amount.toLocaleString()} from ${full_name}`,
          text: messageBody,
        };

        await mailer.sendMail(mailOptions);
        console.log("✅ Email notification sent successfully to", toEmail);
      } else {
        console.warn("⚠️ Gmail notifications are skipped because transporter or target email is not configured.");
      }
    } catch (error) {
      console.error("❌ Failed to send Email notification:", error);
    }
  },

  async sendTestEmail() {
    const rawToEmail = process.env.NOTIFICATION_EMAIL_TO || process.env.GMAIL_USER;
    const toEmail = cleanEnv(rawToEmail);
    const cleanUser = cleanEnv(process.env.GMAIL_USER);
    
    if (!cleanUser || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error("Missing Gmail credentials (GMAIL_USER and GMAIL_APP_PASSWORD) in server environment variables.");
    }
    
    if (!toEmail) {
      throw new Error("Missing recipient address (NOTIFICATION_EMAIL_TO or GMAIL_USER is empty).");
    }

    const mailer = getTransporter();
    if (!mailer) {
      throw new Error("Failed to initialize Gmail transporter. Ensure GMAIL_USER and GMAIL_APP_PASSWORD are valid.");
    }

    const mailOptions = {
      from: `"SD GHT Test Connection" <${cleanUser}>`,
      to: toEmail,
      subject: `🧪 SD GHT: Email Diagnostics Test Success!`,
      text: `Hello! If you are reading this email, it means your Gmail SMTP settings (GMAIL_USER & GMAIL_APP_PASSWORD) have been configured CORRECTLY on your hosting provider.\n\nTime of test: ${new Date().toISOString()}\nRecipient Email: ${toEmail}\nSender Email: ${cleanUser}\n\nCongratulations! Everything is set up perfectly to receive order notifications.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #10b981; margin-top: 0;">🧪 SD GHT: Email Connection Successful!</h2>
          <p>Hello!</p>
          <p>If you are reading this message, it means your Gmail integration (SMTP) has been configured <strong>CORRECTLY</strong> inside your application environment variables.</p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Diagnostic Details:</strong></p>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
              <li><strong>Sender:</strong> ${cleanUser}</li>
              <li><strong>Recipient:</strong> ${toEmail}</li>
              <li><strong>Timestamp:</strong> ${new Date().toUTCString()}</li>
              <li><strong>Status:</strong> Connected & Authorized</li>
            </ul>
          </div>
          <p>You can now successfully receive real-time, instantaneous notifications when users place new orders or submit consulting requests.</p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">This is an automated diagnostics test email sent from the Admin Dashboard.</p>
        </div>
      `
    };

    const info = await mailer.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      envelope: info.envelope,
      to: toEmail
    };
  }
};
