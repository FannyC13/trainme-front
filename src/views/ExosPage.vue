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
            <button class="generate-qcm" @click="generateQCM">Générer le QCM</button>
          </div>
        </div>
      </div>

      <div v-if="uploadedFiles.length && qcmQuestions.length" class="qcm-section section">
        <h2>Exercice QCM généré</h2>

        <div v-if="loading" class="loading-indicator">
          <p>Chargement du QCM...</p>
        </div>

        <div v-if="!loading && qcmQuestions.length">
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
      server: 8080
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
    async generateQCM () {
      this.loading = true
      try {
        this.qcmQuestions = [
          {
            question: 'Quelle est la formule de l\'aire d\'un cercle ?',
            options: ['πr²', '2πr', 'πd', 'r²'],
            answer: 'πr²'
          },
          {
            question: 'Qui a écrit \'Les Misérables\' ?',
            options: ['Victor Hugo', 'Emile Zola', 'Marcel Proust', 'Albert Camus'],
            answer: 'Victor Hugo'
          }
        ]
        this.userAnswers = new Array(this.qcmQuestions.length).fill('')
      } catch (error) {
        alert('Erreur : ' + error.message)
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
