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
          <input
            id="course-name"
            type="text"
            v-model="courseName"
            placeholder="Ex : Calcul intégral"
          />
        </div>

        <div class="upload-box" @dragover.prevent @drop.prevent="handleDrop">
          <div v-if="uploadedFiles.length === 0" class="upload-content">
            <p>Glissez et déposez vos fichiers ici</p>

            <div class="detail-buttons">
              <button
                class="detail-button"
                :class="{ active: detailLevel === 'Très détaillé' }"
                @click="setDetailLevel('Très détaillé')">
                Très détaillé
              </button>
              <button
                class="detail-button"
                :class="{ active: detailLevel === 'Détaillé' }"
                @click="setDetailLevel('Détaillé')">
                Détaillé
              </button>
              <button
                class="detail-button"
                :class="{ active: detailLevel === 'Synthétisé' }"
                @click="setDetailLevel('Synthétisé')">
                Synthétisé
              </button>
            </div>

            <button @click="triggerFileInput">Télécharger</button>
            <input
              type="file"
              ref="fileInput"
              style="display: none"
              @change="handleFileSelect"
              accept=".pdf,.ppt,.docx,.png,.jpg"
              multiple
            />
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
import jsPDF from 'jspdf'

export default {
  name: 'FichePage',
  data () {
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
    triggerFileInput () {
      this.$refs.fileInput.click()
    },
    handleFileSelect (event) {
      const files = Array.from(event.target.files)
      this.uploadedFiles.push(...files)
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      fetch(`http://localhost:${this.server}/upload`, {
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
    handleDrop (event) {
      const files = Array.from(event.dataTransfer.files)
      this.uploadedFiles.push(...files)
    },
    removeFile (index) {
      console.log('here')
      const fileName = this.uploadedFiles[index].name
      console.log('Suppression du fichier', fileName)
      fetch(`http://localhost:${this.server}/delete?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      })
        .then(response => response.json())
        .then(data => {
          console.log(data.message)
          // Retirer le fichier de la liste affichée
          this.uploadedFiles.splice(index, 1)
        })
        .catch(error => {
          console.error('Erreur lors de la suppression du fichier :', error)
        })
    },
    setDetailLevel (level) {
      this.detailLevel = level
    },
    async generateSummary () {
      this.loading = true
      const fileName = this.uploadedFiles[0].name
      console.log('File', fileName)
      try {
        if (this.uploadedFiles.length === 0) {
          alert('Veuillez télécharger un fichier avant de générer une synthèse.')
          return
        }

        const pdfName = this.uploadedFiles[0].name
        const response = await fetch('http://localhost:5000/test/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pdf_name: pdfName,
            max_length: 130,
            min_length: 30,
            model: 'facebook/bart-large-cnn'
          })
        })

        const data = await response.json()

        if (response.ok) {
          const generatedContent = `
            ${this.selectedSubject} : ${this.courseName}

          Synthèse générée automatiquement :
          ${data.summary}
        `
          const pdf = new jsPDF()
          pdf.setFontSize(16)
          pdf.text(`Fiche de cours - ${this.selectedSubject}`, 10, 10)
          pdf.setFontSize(12)
          pdf.text(generatedContent, 10, 20, { maxWidth: 180 })

          const pdfBlob = pdf.output('blob')
          this.courseSummaryUrl = URL.createObjectURL(pdfBlob)
        } else {
          alert(`Erreur : ${data.error || 'Une erreur est survenue.'}`)
        }
      } catch (error) {
        alert(`Erreur lors de la génération : ${error.message}`)
      } finally {
        this.loading = false
      }
    },

    getFileIcon (fileName) {
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
