const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const folder = process.env.VUE_APP_PDF_BASE_PATH;

if (!folder) {
  throw new Error('VUE_APP_PDF_BASE_PATH is not defined in .env');
}

const uploadFolder = path.join(folder, 'course');
console.log('Upload folder:', uploadFolder);
const app = express();

// CORS middleware for the proxy server
app.use(cors({
  origin: 'http://localhost:8080', // Allow frontend (Vue) to make requests
  methods: ['GET', 'POST', 'OPTIONS'], // Allow these methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Proxy middleware to forward requests to the external server
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8084', // Remote server URL
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Remove '/api' prefix before forwarding
  },
  onProxyRes: function (proxyRes) {
    // Add CORS headers to the response
    proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
}));



// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// File upload endpoint
app.post('/upload', upload.array('files'), (req, res) => {
  res.send({ message: 'Fichiers téléchargés avec succès', uploadFolder });
});

// File delete endpoint
app.delete('/delete', (req, res) => {
  const { fileName } = req.query;
  const filePath = path.join(uploadFolder, fileName);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Erreur lors de la suppression du fichier :', err);
      return res.status(500).send({ message: 'Erreur lors de la suppression du fichier' });
    }
    res.send({ message: 'Fichier supprimé avec succès' });
  });
});


// Handle the proxy server requests
const PORT = 8084;
app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});