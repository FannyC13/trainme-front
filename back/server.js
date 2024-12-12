const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const cors = require('cors')

const app = express()
const uploadFolder = path.join(__dirname, 'course')
const { createProxyMiddleware } = require('http-proxy-middleware')

app.use('/api', createProxyMiddleware({
  target: 'http://127.0.0.1:5000',
  changeOrigin: true,
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080'
  }
}))

app.use(cors({
  origin: 'http://localhost:8080',
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
  res.send({ message: 'Fichiers téléchargés avec succès' })
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

const SERVER = 8084
module.exports = { SERVER }

app.listen(SERVER, () => console.log(`Serveur démarré sur le port  ${SERVER}`))
