const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const cors = require('cors') // Importer cors

const app = express()
const uploadFolder = path.join(__dirname, 'course')

// Autoriser toutes les origines (vous pouvez personnaliser selon vos besoins)
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

app.listen(3000, () => console.log('Serveur démarré sur le port 3000'))
