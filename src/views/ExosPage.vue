<template>
  <div id="exos-page" class="main-container">
    <div class="content">
      <div id="fiche-de-cours" class="section">
        <h1>Cours</h1>
        <div class="form-group">
          <label for="subject-select">Choisissez une matière :</label>
          <select id="subject-select" v-model="selectedSubject">
            <option disabled value=''>Sélectionner une matière</option>
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
            <p>Ou</p>
            <button @click="triggerFileInput">Télécharger</button>
            <input type="file" ref="fileInput" style="display: none" @change="handleFileSelect" accept=".pdf,.ppt,.docx,.png,.jpg" multiple />
          </div>
          <div v-else class="file-list">
            <div class="file-item" v-for="(file, index) in uploadedFiles" :key="index">
              <div class="file-icon">
                <span>{{ getFileIcon(file.name) }}</span>
              </div>
              <div class="file-name">
                {{ file.name }}
              </div>
              <button class="remove-file" @click="removeFile(index)">✖</button>
            </div>
            <button class="generate-qcm" @click="generateQCM" :disabled="loading">
              {{ loading ? 'Chargement du qcm...' : 'Générer le QCM' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="!loading & qcmQuestions.length>0" class="qcm-section section">
      <h2>Exercice QCM généré</h2>

      <div v-if="loading" class="loading-indicator">
        <p>Chargement du QCM...</p>
      </div>

      <div v-else>
        <form @submit.prevent="submitAnswers">
          <div v-for="(question, index) in qcmQuestions" :key="index" class="question-container">
            <p>{{ question.question }}</p>
            <div v-for="(option, idx) in question.options" :key="idx" class="option">
              <input
                type="radio"
                :name="'question' + index"
                :value="option"
                v-model="userAnswers[index]"
                :disabled="showResult"
                :class="{
                  'correct-answer': showResult && option === question.answer && userAnswers[index] === option,
                  'incorrect-answer': showResult && option !== question.answer && userAnswers[index] === option,
                  'correct-but-not-answered': showResult && option === question.answer && userAnswers[index] !== option
                }"
              />
              <label :class="{
                'correct-answer-label': showResult && option === question.answer && userAnswers[index] === option,
                'incorrect-answer-label': showResult && option !== question.answer && userAnswers[index] === option,
                'correct-but-not-answered-label': showResult && option === question.answer && userAnswers[index] !== option
              }">
                {{ option }}
              </label>
            </div>
          </div>

          <button type="submit">Valider les réponses</button>
        </form>
      </div>

      <div v-if="showResult" class="result">
        <h3>Résultats :</h3>
        <p>Votre score : {{ score }}/{{ qcmQuestions.length }}</p>
        <button @click="downloadQcmPdf">Télécharger le QCM corrigé</button>
      </div>
    </div>

    </div>
  </div>
</template>

<script>
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
export default {
  name: 'ExosPage',
  data () {
    return {
      uploadedFiles: [],
      loading: false,
      qcmQuestions: [],
      userAnswers: [],
      showResult: false,
      score: 0,
      selectedSubject: '',
      courseName: '',
      server: 8084
    }
  },
  methods: {
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
    handleDrop (event) {
      const files = Array.from(event.dataTransfer.files)
      this.uploadedFiles.push(...files)
    },
    removeFile (index) {
      console.log('here')
      const fileName = this.uploadedFiles[index].name
      console.log('Suppression du fichier', fileName)
      fetch(`https://geddhloie9nywe-${this.server}.proxy.runpod.net/delete?fileName=${encodeURIComponent(fileName)}`, {
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
    async generateQCM () {
      this.loading = true
      this.qcmQuestions = []
      this.userAnswers = []
      this.showResult = false
      this.score = 0
      this.selectedSubject = ''
      this.courseName = ''

      const fileName = this.uploadedFiles[0]?.name

      if (!fileName) {
        alert('Veuillez télécharger un fichier avant de générer une synthèse.')
        return
      }

      console.log('File Name:', fileName)

      try {
        const path = `${process.env.VUE_APP_PDF_BASE_PATH}/${fileName}`
        console.log(path)
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
        const qcmResponse = await fetch('https://geddhloie9nywe-5000.proxy.runpod.net/generate/qcm', {
          mode: 'no-cors',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            raw_text: extractedText,
            api_key: apiKey,
            model: 'gpt-4o-mini'
          })
        })

        const qcmData = await qcmResponse.json()
        const qcmFormatted = Array.isArray(qcmData.questions) ? qcmData.questions : [qcmData.questions]

        console.log(qcmFormatted)
        this.qcmQuestions = JSON.parse(qcmFormatted)
        this.userAnswers = new Array(this.qcmQuestions.length).fill('')
        if (!qcmData) {
          throw new Error(`${qcmData.error || 'Erreur inconnue.'}`)
        }
      } catch (error) {
        alert(`Erreur lors de la génération : ${error.message}`)
      } finally {
        this.loading = false
      }
    },
    submitAnswers () {
      this.showResult = true
      this.score = 0
      this.qcmQuestions.forEach((question, index) => {
        if (this.userAnswers[index] === question.answer) {
          this.score++
        }
      })
    },
    /* eslint-disable new-cap */
    async downloadQcmPdf () {
      const element = document.querySelector('.qcm-section')
      const canvas = await html2canvas(element, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 190
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save('QCM_Resultats.pdf')
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
