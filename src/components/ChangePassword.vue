<template>
  <div class="form-container">
    <h2>Change Password</h2>
    <form @submit.prevent="changePassword">
      <label>Current Password:</label>
      <input v-model="currentPassword" type="password" required />

      <label>New Password:</label>
      <input v-model="newPassword" type="password" required />

      <label>Confirm New Password:</label>
      <input v-model="confirmPassword" type="password" required />

      <button type="submit" :disabled="loading">
        {{ loading ? "Changing..." : "Change Password" }}
      </button>
    </form>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        loading: false
      };
    },
    methods: {
      async changePassword() {
        if (this.newPassword !== this.confirmPassword) {
          alert("New passwords do not match!");
          return;
        }

        try {
          this.loading = true;
          const token = localStorage.getItem("token");
          const res = await fetch("http://136.186.108.171/api/auth/change-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ token }`
          },
        body: JSON.stringify({
          oldPassword: this.currentPassword,
          newPassword: this.newPassword
        })
      });

      const data = await res.json();
      if(res.ok) {
    alert("Password changed successfully!");
    this.$router.push("/home");
  } else {
    alert(data.error || "Failed to change password");
  }
      } catch (err) {
    console.error("Change password error:", err);
    alert("Error changing password");
  } finally {
    this.loading = false;
  }
    }
  }
};
</script>

<style scoped>
  .form-container {
    max-width: 500px;
    margin: 2rem auto;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 10px;
  }

  label {
    margin-top: 1rem;
    display: block;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.3rem;
  }

  button {
    margin-top: 1.5rem;
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  body.dark label {
    color: #000000 !important;
  }
</style>
