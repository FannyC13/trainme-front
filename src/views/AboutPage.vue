<template>
    <div id="about-page" class="main-container">
        <main class="content">
            <section class="about-section">
                <h1>À propos de nous</h1>
                <p>
                    Nous sommes un groupe de six étudiants motivés : Paul, Noé, Sacha, Rami et Fanny.
                    Notre objectif est de créer un site web qui aide les étudiants à mieux s'entraîner grâce
                    à des exercices adaptés et des fiches résumées et simplifiées de cours.
                </p>

                <div class="team">
                    <div class="team-member" v-for="member in teamMembers" :key="member.name">
                        <img :src="member.image" :alt="member.name" class="profile-pic" />
                        <p>{{ member.name }}</p>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script>

export default {
  name: 'AboutPage',
  data () {
    return {
      teamMembers: [
        { name: 'Paul', image: require('@/assets/Paul.jpg') },
        { name: 'Noé', image: require('@/assets/Noe.jpg') },
        { name: 'Sacha', image: require('@/assets/Sacha.jpg') },
        { name: 'Rami', image: require('@/assets/Rami.jpg') },
        { name: 'Fanny', image: require('@/assets/Fanny.jpg') }
      ]
    }
  },
  mounted () {
    this.currentPath = this.$route.path
  }
}
</script>

<style src="../styles.css"></style>
