const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const cors = require('cors')
const app = express()

const { createProxyMiddleware } = require('http-proxy-middleware')
const { debug } = require('console')

require('dotenv').config();
console.log("AAAAAAAAAAAAAAAaaa")
const folder = process.env.VUE_APP_PDF_BASE_PATH;

if (!folder) {
  throw new Error('VUE_APP_PDF_BASE_PATH is not defined in .env');
}

const uploadFolder = path.join(folder, 'course');
console.log('Upload folder:', uploadFolder);

app.use('/api', createProxyMiddleware({
  target: 'https://geddhloie9nywe-5000.proxy.runpod.net/',
  changeOrigin: true,
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = 'https://geddhloie9nywe-8080.proxy.runpod.net/'
  }
}))

app.use(cors({
  origin: 'https://geddhloie9nywe-8080.proxy.runpod.net/',
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(cors())

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage })

app.post('/upload', upload.array('files'), (req, res) => {
  res.send({ message: 'Fichiers téléchargés avec succès TEST', uploadFolder })
})

app.delete('/delete', (req, res) => {
  const { fileName } = req.query
  const filePath = path.join(uploadFolder, fileName)
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Erreur lors de la suppression du fichier :', err)
      return res.status(500).send({ message: 'Erreur lors de la suppression du fichier' })
    }
    res.send({ message: 'Fichier supprimé avec succès' })
  })
})

const HOST = '0.0.0.0';
const PORT = 8084;

app.listen(PORT, HOST, () => {
  console.log(`Serveur démarré sur http://${HOST}:${PORT}`);
});