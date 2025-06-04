<template>
  <div id="app">
    <!-- Header - simplified, no navigation -->
    <header v-if="isLoggedIn">
      <h1>EcoHabit</h1>
    </header>

    <!-- Main content area -->
    <main :class="{ 'with-bottom-nav': isLoggedIn }">
      <router-view />
    </main>

    <!-- Bottom Navigation Bar - only shown when logged in -->
    <nav v-if="isLoggedIn" class="bottom-nav">
      <router-link to="/home" class="nav-item" active-class="active">
        <div class="nav-icon">🏠</div>
        <span class="nav-label">Home</span>
      </router-link>

      <router-link to="/history" class="nav-item" active-class="active">
        <div class="nav-icon">📊</div>
        <span class="nav-label">History</span>
      </router-link>

      <!-- Center Add Trip Button -->
      <router-link to="/select-mode" class="nav-item center-button" active-class="active">
        <div class="center-icon">+</div>
      </router-link>

      <router-link to="/leaderboard" class="nav-item" active-class="active">
        <div class="nav-icon">🏆</div>
        <span class="nav-label">Leaderboard</span>
      </router-link>

      <button @click="showSettings = true" class="nav-item settings-btn">
        <div class="nav-icon">⚙️</div>
        <span class="nav-label">Settings</span>
      </button>
    </nav>

    <!-- Settings Modal/Overlay -->
    <div v-if="showSettings" class="settings-overlay" @click="showSettings = false">
      <div class="settings-modal" @click.stop>
        <div class="settings-header">
          <h3>Settings</h3>
          <button @click="showSettings = false" class="close-btn">×</button>
        </div>
        <div class="settings-content">
          <button @click="logout" class="settings-option logout-btn">
            <span class="option-icon">🚪</span>
            <span>Logout</span>
          </button>
          <button class="settings-option" disabled>
            <span class="option-icon">🌙</span>
            <span>Dark Mode (Coming Soon)</span>
          </button>
          <button class="settings-option" disabled>
            <span class="option-icon">📍</span>
            <span>Location Settings (Coming Soon)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Android-only footer -->
    <footer v-if="isAndroid && !isLoggedIn" class="android-footer">
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
        isAndroid: false,
        showSettings: false
      };
    },
    methods: {
      checkAuth() {
        this.isLoggedIn = !!localStorage.getItem('token');
      },
      logout() {
        localStorage.removeItem('token');
        this.isLoggedIn = false;
        this.showSettings = false;
        this.$router.push('/login');
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
        this.showSettings = false; // Close settings when navigating
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
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    padding: 1rem;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  header h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  main {
    flex: 1;
    padding: 1rem;
    max-width: 960px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  main.with-bottom-nav {
    padding-bottom: 80px; /* Account for bottom nav height */
  }

  /* Bottom Navigation Styles */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 8px 0;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    border-top: 1px solid #e5e7eb;
    z-index: 1000;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    color: #6b7280;
    transition: all 0.2s ease;
    padding: 8px 12px;
    border-radius: 12px;
    min-width: 60px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
  }

  .nav-item:hover {
    color: #007bff;
    background-color: #f8fafc;
  }

  .nav-item.active {
    color: #007bff;
    background-color: #eff6ff;
  }

  .nav-icon {
    font-size: 1.4rem;
    margin-bottom: 2px;
  }

  .nav-label {
    font-size: 0.7rem;
    font-weight: 500;
  }

  /* Center Add Button */
  .center-button {
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    border-radius: 50%;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    transform: translateY(-8px);
  }

  .center-button:hover {
    background: linear-gradient(135deg, #0056b3, #004494);
    color: white;
    transform: translateY(-10px);
    box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
  }

  .center-button.active {
    background: linear-gradient(135deg, #0056b3, #004494);
    color: white;
  }

  .center-icon {
    font-size: 1.8rem;
    font-weight: bold;
  }

  /* Settings Modal */
  .settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: flex-end;
    z-index: 2000;
  }

  .settings-modal {
    background: white;
    width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 50vh;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .settings-header h3 {
    margin: 0;
    color: #111827;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .close-btn:hover {
    background-color: #f3f4f6;
  }

  .settings-content {
    padding: 1rem;
  }

  .settings-option {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 1rem;
    border: none;
    background: none;
    text-align: left;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .settings-option:hover:not(:disabled) {
    background-color: #f3f4f6;
  }

  .settings-option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option-icon {
    margin-right: 0.75rem;
    font-size: 1.2rem;
  }

  .logout-btn {
    color: #dc2626;
  }

  .logout-btn:hover {
    background-color: #fef2f2;
  }

  .android-footer {
    background: #007bff;
    color: white;
    padding: 1rem;
    text-align: center;
    border-radius: 8px;
    margin: 1rem;
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .nav-label {
      font-size: 0.65rem;
    }

    .nav-icon {
      font-size: 1.2rem;
    }

    .center-button {
      width: 50px;
      height: 50px;
    }

    .center-icon {
      font-size: 1.6rem;
    }
  }
</style>
