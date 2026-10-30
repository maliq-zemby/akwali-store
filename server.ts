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
  app.post('/api/notify', (req, res) => {
    const { type, email, details } = req.body;
    console.log(`[EMAIL NOTIFICATION] To: maliqzemby8@gmail.com`);
    console.log(`[EVENT] ${type}`);
    console.log(`[USER] ${email}`);
    if (details) console.log(`[DETAILS]`, details);
    
    // In a real app, you'd use a service like Resend, SendGrid, or AWS SES here.
    // For this build, we simulate the webhook/cloud function as requested.
    
    res.status(200).json({ success: true, message: 'Notification logged' });
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
