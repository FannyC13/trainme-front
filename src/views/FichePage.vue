<template>
  <div id="fiche-page" class="main-container">
    <div class="content">
      <div id="fiche-de-cours" class="section">
        <h1>Fiche de cours</h1>

        <div class="form-group">
          <label for="subject-select">Choisissez une matière :</label>
          <select id="subject-select" v-model="selectedSubject">
            <option disabled value="">Sélectionner une matière</option>
            <option>Mathématiques</option>
            <option>Français</option>
            <option>Philosophie</option>
            <option>Histoire</option>
            <option>Physique</option>
          </select>
        </div>

        <div class="form-group">
          <label for="course-name">Nom du cours :</label>
          <input id="course-name" type="text" v-model="courseName" placeholder="Ex : Calcul intégral" />
        </div>

        <div class="upload-box" @dragover.prevent @drop.prevent="handleDrop">
          <div v-if="uploadedFiles.length === 0" class="upload-content">
            <p>Glissez et déposez vos fichiers ici</p>


            <button @click="triggerFileInput">Télécharger</button>
            <input type="file" ref="fileInput" style="display: none" @change="handleFileSelect"
              accept=".pdf,.ppt,.docx,.png,.jpg" multiple />
          </div>
          <div v-else class="file-list">
            <div class="file-item" v-for="(file, index) in uploadedFiles" :key="file.name">
              <div class="file-icon">
                <span>{{ getFileIcon(file.name) }}</span>
              </div>
              <div class="file-name">{{ file.name }}</div>
              <button class="remove-file" @click="removeFile(index)">✖</button>
            </div>
            <button class="generate-summary" @click="generateSummary" :disabled="loading">
              {{ loading ? 'Chargement...' : 'Générer la fiche de cours' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="courseSummaryUrl" class="course-summary section">
        <h2>Fiche de cours générée</h2>
        <iframe :src="courseSummaryUrl" width="100%" height="500px"></iframe>
      </div>
    </div>
  </div>
</template>

<script>
import html2pdf from 'html2pdf.js'
import { marked } from 'marked'
export default {
  name: 'FichePage',
  data() {
    return {
      uploadedFiles: [],
      loading: false,
      courseSummaryUrl: null,
      selectedSubject: '',
      courseName: '',
      detailLevel: 'Détaillé',
      server: 8084
    }
  },
  methods: {
    /* eslint-disable new-cap */
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      this.uploadedFiles.push(...files)
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      fetch(`https://geddhloie9nywe-${this.server}.proxy.runpod.net/upload`, {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          console.log(data.message)
        })
        .catch(error => {
          console.error('Erreur lors du téléchargement des fichiers :', error)
        })
    },
    handleDrop(event) {
      const files = Array.from(event.dataTransfer.files)
      this.uploadedFiles.push(...files)
    },
    removeFile(index) {
      const fileName = this.uploadedFiles[index].name
      console.log('Suppression du fichier', fileName)
      fetch(`https://geddhloie9nywe-${this.server}.proxy.runpod.net/delete?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      })
        .then(response => response.json())
        .then(data => {
          console.log(data.message)
          this.uploadedFiles.splice(index, 1)
        })
        .catch(error => {
          console.error('Erreur lors de la suppression du fichier :', error)
        })
    },
    setDetailLevel(level) {
      this.detailLevel = level
    },
    async generateSummary() {
      this.loading = true

      const fileName = this.uploadedFiles[0]?.name

      if (!fileName) {
        alert('Veuillez télécharger un fichier avant de générer une synthèse.')
        this.loading = false
        return
      }

      console.log('File NameA:', fileName)

      try {
        const path = `${process.env.VUE_APP_PDF_BASE_PATH}//${fileName}`

        console.log('Path test here', path)
        const extractResponse = await fetch('https://geddhloie9nywe-5000.proxy.runpod.net/extract/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ pdf_path: path })
        })

        const extractData = await extractResponse.json()

        if (!extractResponse.ok) {
          throw new Error(`Erreur lors de l'extraction : ${extractData.error || 'Erreur inconnue.'}`)
        }

        const extractedText = extractData.text

        if (!extractedText) {
          throw new Error('Le texte extrait est vide.')
        }

        console.log('Texte extrait avec succès:', extractedText)
        const apiKey = process.env.VUE_APP_API_KEY || ''
        if (!apiKey) {
          alert("La clé API n'est pas configurée.")
          return
        }
        const summarizeResponse = await fetch('https://geddhloie9nywe-5000.proxy.runpod.net/summarize/pretty', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: extractedText,
            api_key: apiKey,
            max_length: 130,
            min_length: 30
          })
        })

        const summarizeData = await summarizeResponse.json()

        if (!summarizeResponse.ok) {
          throw new Error(`Erreur lors de la synthèse : ${summarizeData.error || 'Erreur inconnue.'}`)
        }

        console.log('Synthèse générée avec succès:', summarizeData.summary)

        const markdownContent = summarizeData.summary;
        const htmlContent = marked(markdownContent); // Convert Markdown to HTML

        // Create a temporary div to hold the HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.paddingBottom = '50px'; // Add padding to avoid content cut-off

// Use html2pdf to generate PDF
const options = {
  filename: `Fiche_de_cours_${this.selectedSubject}.pdf`, // File name
  margin: 10, // Margin around the page
  image: { type: 'jpeg', quality: 0.98 }, // Image format for PDF (optional)
  html2canvas: { scale: 4 }, // High-quality rendering
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } // PDF format and orientation
};

// Use html2pdf to generate the PDF and display the result
html2pdf()
  .from(tempDiv)
  .set(options)
  .toPdf()
  .get('pdf')
  .then((pdf) => {
    const pdfBlob = pdf.output('blob');
    this.courseSummaryUrl = URL.createObjectURL(pdfBlob);
    console.log('Generated PDF URL:', this.courseSummaryUrl);
  });



      } catch (error) {
        alert(`Erreur : ${error.message}`);
      } finally {
        this.loading = false;
      }},
      getFileIcon(fileName) {
        const extension = fileName.split('.').pop().toLowerCase()
        const icons = {
          pdf: '📄',
          docx: '📄',
          ppt: '📊',
          png: '🖼️',
          jpg: '🖼️'
        }
        return icons[extension] || '📁'
      }
    }
  }
</script>

<style src="../styles.css"></style>
