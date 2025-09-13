<template>
  <div class="form-container">
    <h2>Register</h2>
    <form @submit.prevent="register">
      <input v-model="name" type="text" placeholder="Full Name" required />
      <input v-model="username" type="text" placeholder="Username" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Register</button>
      <p class="message">{{ message }}</p>
    </form>
    <router-link class="link" to="/login">Already have an account? Login</router-link>
  </div>
</template>

<script>export default {
    data() {
      return {
        name: '',
        username: '',
        email: '',
        password: '',
        message: ''
      };
    },
    methods: {
      async register() {
        try {
          const res = await fetch('http://136.186.108.171/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: this.name,           // ✅ Include full name
              username: this.username,
              email: this.email,
              password: this.password
            })
          });
          const data = await res.json();
          if (data.message) {
            this.message = "Registration successful!";
            this.$router.push({ path: '/login', query: { created: 'true' } });
          } else {
            this.message = data.error || "Registration failed.";
          }
        } catch (err) {
          this.message = "Registration request failed.";
        }
      }
    }
  };</script>

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
  }

  .message {
    margin-top: 1rem;
    color: #28a745;
  }

  .link {
    margin-top: 1rem;
    display: block;
    color: #007bff;
    text-decoration: underline;
    font-size: 0.9rem;
  }
</style>
