import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // API Routes
  app.post("/api/notify-order", async (req, res) => {
    try {
      const { orderId, shipping, items, totalWithShipping } = req.body;

      const orderMsg = 
`New Order Placed! (ID: ${orderId})
Name: ${shipping.fullName}
Phone: ${shipping.phone}
Address: ${shipping.address}, ${shipping.city}, ${shipping.country}

Items:
${items.map((i: any) => `- ${i.quantity}x ${i.product.name} (Rs. ${i.product.price})`).join('\n')}

Total: Rs. ${totalWithShipping}`;

      console.log("-------------------");
      console.log("ORDER NOTIFICATION TO SEND:");
      console.log(orderMsg);
      console.log("-------------------");

      // 1. Send Email (using nodemailer)
      // Note: You need to set SMTP_EMAIL and SMTP_PASSWORD in your .env file
      let emailSent = false;
      if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail', // commonly used, or custom SMTP host
            auth: {
              user: process.env.SMTP_EMAIL,
              pass: process.env.SMTP_PASSWORD
            }
          });
          await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: 'anshbnsingh28@gmail.com', // Admin email
            subject: `New Order Placed - ${orderId}`,
            text: orderMsg,
          });
          emailSent = true;
          console.log("Email sent successfully!");
        } catch (e) {
          console.error("Failed to send email:", e);
        }
      }

      res.json({ 
        success: true, 
        message: "Notification processing complete.",
        emailSent
      });

    } catch (error: any) {
      console.error('Error in /api/notify-order:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built files out of dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
