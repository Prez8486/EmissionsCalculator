<template>
  <div class="form-container">
    <h2>Login</h2>
    <form @submit.prevent="login">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />

      <button type="submit" :disabled="loading">
        <span v-if="!loading">Login</span>
        <span v-else>
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          Loading...
        </span>
      </button>

      <p class="message" :style="{ color: showToast ? '#28a745' : '#dc3545' }">
        {{ message }}
      </p>
    </form>

    <router-link class="link" to="/register">
      Don't have an account? Register
    </router-link>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: '',
      message: '',
      showToast: false,
      loading: false   // <-- ✅ Declare loading here
    };
  },
  mounted() {
    // Show toast if registration successful
    if (this.$route.query.created === 'true') {
      this.message = 'Account created!';
      this.showToast = true;

      setTimeout(() => {
        this.message = '';
        this.showToast = false;
        this.$router.replace({ path: this.$route.path }); // clear ?created=true
      }, 5000);
    }
  },
  methods: {
    async login() {
      this.loading = true;
      try {
        const res = await fetch('https://emissionscalculatorbackend-2.onrender.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          this.$router.push('/home');
        } else {
          this.message = data.error || "Login failed.";
        }
      } catch (err) {
        this.message = "Login request failed.";
      } finally {
        this.loading = false; // ✅ Reset button state
      }
    }
  }
};
</script>

<style scoped>
.form-container {
  max-width: 400px;
  margin: 5rem auto;
  padding: 2rem;
  background-color: #f3f4f6;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
  text-align: center;
}

h2 {
  color: #007bff;
  margin-bottom: 1.5rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

input {
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
}

button {
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.message {
  margin-top: 1rem;
  color: #dc3545;
}

.link {
  margin-top: 1rem;
  display: block;
  color: #007bff;
  text-decoration: underline;
  font-size: 0.9rem;
}

/* Bootstrap spinner */
.spinner-border {
  width: 1rem;
  height: 1rem;
  border-width: 0.15em;
}
</style>
