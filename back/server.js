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

// Increase the file upload size limit and configure body parsing middleware
app.use(express.json({ limit: '50mb' })); // Allow up to 50 MB in the body (adjust as needed)
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Ensure large form data is supported

// CORS middleware for the proxy server
app.use(cors({
  origin: (origin, callback) => {
    // Debugging the incoming origin
    console.log('Incoming Origin:', origin);

    // Define allowed origins, including local ports and the proxy pattern
    const allowedOrigins = [
      'http://localhost:8080', // Local development (Vue app)
      'http://localhost:8084',
      'http://localhost:5000',
      'https://geddhloie9nywe-8084.proxy.runpod.net',
      'https://geddhloie9nywe-5000.proxy.runpod.net',
      'https://geddhloie9nywe-8080.proxy.runpod.net'
    ];

    // Allow request if the origin matches any of the allowed origins
    const isAllowedOrigin = allowedOrigins.some(allowedOrigin => origin && origin.includes(allowedOrigin));

    if (isAllowedOrigin || !origin) {
      callback(null, true); // Allow the request if the origin is valid
    } else {
      console.log('Origin not allowed:', origin); // Log rejected origins
      callback(new Error('Not allowed by CORS'), false); // Reject the request if the origin is invalid
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Proxy middleware for specific API paths
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8084', // The remote server URL
  changeOrigin: true,  // Change the origin of the request to the target URL
  pathRewrite: {
    '^/api': '',  // Remove '/api' from the path before forwarding
  },
  logLevel: 'debug', // Active les logs détaillés pour mieux diagnostiquer
  timeout: 1200000, // Set a longer timeout for large files (2 minutes)
  onProxyRes: function (proxyRes, req, res) {
    // Set the correct CORS headers dynamically for the proxy response
    console.log('Proxy Response Headers:', proxyRes.headers); // Debug the headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*'; // Allow all origins for the proxy response
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

    // Cache control headers to prevent caching
    proxyRes.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
    proxyRes.headers['Pragma'] = 'no-cache';
    proxyRes.headers['Expires'] = '0';

    // Return the modified headers
    res.set(proxyRes.headers);
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

// Allow handling large file uploads by increasing limits
const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 } // Increase the file size limit to 50 MB
});

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
