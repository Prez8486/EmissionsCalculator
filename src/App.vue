<template>
  <div id="app">
    <header>
      <h1>Transport Emissions Tracker</h1>
      <button class="menu-toggle" @click="toggleMenu">
        ☰
      </button>
      <nav :class="{ open: menuOpen }">
        <template v-if="isLoggedIn">
          <router-link to="/home" @click="closeMenu">Home</router-link>
          <router-link to="/select-mode" @click="closeMenu">Add Trip</router-link>
          <router-link to="/history" @click="closeMenu">History</router-link>
          <a href="#" @click.prevent="logout">Logout</a>
        </template>
        <template v-else>
          <router-link to="/login" @click="closeMenu">Login</router-link>
          <router-link to="/register" @click="closeMenu">Register</router-link>
        </template>
      </nav>
    </header>

    <main>
      <router-view />
    </main>
    

    <!-- Android-only footer -->
    <footer v-if="isAndroid" class="android-footer">
      <p>📱 Android App - EcoHabit</p>
    </footer>
  </div>
</template>

<script>
  export default {
    name: 'App',
    data() {
      return {
        isLoggedIn: false,
        menuOpen: false,
        isAndroid: false
      };
    },
    methods: {
      checkAuth() {
        this.isLoggedIn = !!localStorage.getItem('token');
      },
      logout() {
        localStorage.removeItem('token');
        this.isLoggedIn = false;
        this.$router.push('/login');
      },
      toggleMenu() {
        this.menuOpen = !this.menuOpen;
      },
      closeMenu() {
        this.menuOpen = false;
      }
    },
    created() {
      this.checkAuth();
    },
    mounted() {
      // Detect Android user agent
      this.isAndroid = /Android/i.test(navigator.userAgent);
    },
    watch: {
      '$route'() {
        this.checkAuth();
        this.closeMenu();
      }
    }
  };
</script>

<style>
  body {
    margin: 0;
    font-family: 'Segoe UI', sans-serif;
    background-color: #f3f4f6;
  }

  #app {
    padding: 1rem;
    max-width: 960px;
    margin: auto;
  }

  header {
    background-color: #007bff;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    position: relative;
    text-align: center;
  }

  .menu-toggle {
    display: none;
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.8rem;
    color: white;
    cursor: pointer;
  }

  nav {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    transition: max-height 0.3s ease-out;
  }

    nav a {
      color: white;
      text-decoration: none;
      font-weight: bold;
    }

      nav a.router-link-active {
        text-decoration: underline;
      }

  @media (max-width: 768px) {
    .menu-toggle {
      display: block;
    }

    nav {
      flex-direction: column;
      align-items: center;
      max-height: 0;
      overflow: hidden;
    }

      nav.open {
        max-height: 300px;
        margin-top: 1rem;
      }
  }

  main {
    margin-top: 2rem;
  }

  .android-footer {
    background: #007bff;
    color: white;
    padding: 1rem;
    text-align: center;
    border-radius: 8px;
    margin-top: 2rem;
  }
</style>
