<template>
  <header class="header">
    <div class="logo">
      <img src="@/assets/logo.png" alt="Logo" />
    </div>
    <nav class="navigation">
      <ul>
        <router-link to="/fiche-de-cours" class="nav-link" active-class="active">
          <li class="nav-item">Fiche de cours</li>
        </router-link>
        <router-link to="/exos" class="nav-link" active-class="active">
          <li class="nav-item">Exos</li>
        </router-link>
        <router-link to="/a-propos" class="nav-link" active-class="active">
          <li class="nav-item">À propos</li>
        </router-link>
      </ul>
    </nav>
  </header>
</template>

<script>
export default {
  name: 'NavBar'
}
</script>

<style src="../styles.css"></style>
