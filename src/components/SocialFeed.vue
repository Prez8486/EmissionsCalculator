<template>
  <div class="feed-page">
    <h1>Social Feed</h1>

    <!-- Create Post -->
    <div class="create-post">
      <textarea v-model="newPost" placeholder="Share something..."></textarea>
      <button @click="submitPost">Post</button>
    </div>

    <!-- Feed -->
    <div class="feed-list">
      <div class="post-card" v-for="post in posts" :key="post._id">

        <div class="post-header">
          <strong>{{ post.user.name }}</strong>
          <span>{{ formatDate(post.createdAt) }}</span>
        </div>

        <p class="post-content">{{ post.content }}</p>

        <img v-if="post.image" :src="post.image" class="post-image" />

        <button class="like-btn" @click="toggleLike(post)">
          ❤️ {{ post.likes.length }}
        </button>

      </div>
    </div>
  </div>
</template>

<script>
import { API_BASE } from "@/config/apiConfig.js";

export default {
  data() {
    return {
      posts: [],
      newPost: ""
    };
  },
  methods: {
    async loadPosts() {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/feed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) this.posts = data.posts;
    },

    async submitPost() {
      if (!this.newPost.trim()) return;

      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/feed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: this.newPost })
      });

      this.newPost = "";
      await this.loadPosts();
    },

    async toggleLike(post) {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/feed/${post._id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        // Refresh likes without reloading entire feed
        post.likes.length = data.likes;
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleString();
    }
  },
  mounted() {
    this.loadPosts();
    setInterval(() => this.loadPosts(), 8000); // Auto-refresh feed every 8 seconds
  }
};
</script>

<style scoped>
  .feed-page {
    padding: 1rem;
  }

  .create-post textarea {
    width: 100%;
    height: 80px;
    padding: 8px;
  }

  .create-post button {
    margin-top: 8px;
    padding: 8px 14px;
    background: #0ea5e9;
    color: white;
    border-radius: 8px;
  }

  .post-card {
    background: white;
    padding: 12px;
    margin-top: 1rem;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0,0,0,.1);
  }

  .post-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }

  .post-content {
    margin: 10px 0;
  }

  .post-image {
    width: 100%;
    border-radius: 8px;
  }

  .like-btn {
    margin-top: 8px;
    background: #f3f4f6;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
  }
  body.dark p {
    color: black !important;
  }
  body.dark .post-header {
    color: black !important;
  }
</style>
