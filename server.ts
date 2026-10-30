import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';

dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

async function startServer() {
  const app = express();
  app.use(express.json());

  // Serve static files from public/uploads
  app.use('/uploads', express.static(uploadsDir));

  // File Upload API
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ url: fileUrl, type: req.file.mimetype });
  });

  // Email Notification Webhook / API
  app.post('/api/notify', async (req, res) => {
    const { type, email, details } = req.body;
    
    console.log(`[EVENT] ${type} for ${email}`);

    if (type === 'SIGNUP') {
      try {
        const nodemailer = await import('nodemailer');
        
        // Configuration du transporteur (SMTP)
        // Note: Utilisez des variables d'environnement pour la sécurité
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER, // Votre email (ex: maliqzemby8@gmail.com)
            pass: process.env.EMAIL_PASS  // Votre mot de passe d'application Google
          }
        });

        const mailOptions = {
          from: `"AKWALI STORE" <${process.env.EMAIL_USER}>`,
          to: 'maliqzemby8@gmail.com',
          subject: '🔔 Nouvelle Inscription - AKWALI STORE',
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #3A75C4;">Nouvel utilisateur inscrit !</h2>
              <p>Un nouveau compte vient d'être créé sur <strong>AKWALI STORE</strong>.</p>
              <hr />
              <p><strong>Email :</strong> ${email}</p>
              <p><strong>Rôle :</strong> ${details?.role || 'Non spécifié'}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
              <hr />
              <p style="font-size: 12px; color: #666;">Ceci est une notification automatique de votre application.</p>
            </div>
          `
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await transporter.sendMail(mailOptions);
          console.log(`[SUCCESS] Email sent to maliqzemby8@gmail.com`);
        } else {
          console.warn(`[SKIP] Nodemailer not configured: EMAIL_USER or EMAIL_PASS missing in .env`);
        }
      } catch (error) {
        console.error('[ERROR] Failed to send email:', error);
      }
    }
    
    res.status(200).json({ success: true, message: 'Notification processed' });
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = await vite.transformIndexHtml(url, '');
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
