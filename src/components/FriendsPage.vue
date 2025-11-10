<template>
  <div class="friends-page">
    <h2>🌿 Community Members</h2>

    <!-- Search Filter -->
    <div class="search-bar">
      <input type="text"
             v-model="searchQuery"
             placeholder="Search by name or email..." />
    </div>

    <!-- Users List -->
    <div v-if="filteredUsers.length" class="user-list">
      <div v-for="user in filteredUsers" :key="user._id" class="user-card">
        <div class="user-info">
          <h4>{{ user.name || "Anonymous" }}</h4>
          <p>{{ user.email }}</p>
        </div>

        <div class="user-actions">
          <!-- Friend status -->
          <div v-if="isFriend(user)">
            <span class="badge friend">✅ Friends</span>
            <button @click="removeFriend(user._id)"
                    class="remove-btn"
                    title="Remove this friend">
              🗑️ Remove
            </button>
          </div>

          <!-- Pending requests -->
          <div v-else-if="pendingRequests.some((r) => r._id === user._id)">
            <button @click="acceptRequest(user._id)" class="accept-btn">
              ✅ Accept
            </button>
            <button @click="cancelRequest(user._id)" class="cancel-btn">
              ❌ Cancel
            </button>
          </div>

          <!-- Sent requests -->
          <span v-else-if="user.friendRequests?.includes(currentUserId)"
                class="badge pending">
            ⏳ Request Sent
          </span>

          <!-- Add new friend -->
          <button v-else
                  @click="sendFriendRequest(user._id)"
                  class="add-btn">
            ➕ Add Friend
          </button>
        </div>
      </div>
    </div>

    <p v-else>No users found.</p>

    <div v-if="statusMessage" :class="['message-box', messageType]">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script>
  import { API_BASE } from "@/config/apiConfig.js";

  export default {
    name: "FriendsPage",
    data() {
      return {
        users: [],
        friends: [],
        pendingRequests: [],
        currentUserId: null,
        searchQuery: "",
        statusMessage: "",
        messageType: "info",
      };
    },
    computed: {
      filteredUsers() {
        const query = this.searchQuery.toLowerCase();
        return this.users.filter(
          (u) =>
            u.name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query)
        );
      },
    },
    async mounted() {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        this.currentUserId = payload.userId || payload.id;
      }
      await this.loadFriends();
      await this.loadRequests();
      await this.loadAllUsers();
    },
    methods: {
      // Load all users
      async loadAllUsers() {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/friends/all`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to load users");
          this.users = await res.json();
        } catch (err) {
          console.error("Failed to load all users:", err);
        }
      },

      // Load friend list
      async loadFriends() {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/friends/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        this.friends = data.friends || [];
      },

      // Load pending requests
      async loadRequests() {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/friends/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        this.pendingRequests = data.pendingRequests || [];
      },

      // Accept friend request
      async acceptRequest(friendId) {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/friends/accept/${friendId}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const data = await res.json();
          if (res.ok) {
            this.showMessage("✅ Friend request accepted!", "success");
            await this.loadFriends();
            await this.loadRequests();
          } else {
            this.showMessage(data.error || data.message, "error");
          }
        } catch (err) {
          console.error("Error accepting request:", err);
          this.showMessage("❌ Failed to accept friend request.", "error");
        }
      },

      // Cancel friend request
      async cancelRequest(friendId) {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/friends/cancel/${friendId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const data = await res.json();
          if (res.ok) {
            this.showMessage("❌ Friend request cancelled!", "info");
            this.pendingRequests = this.pendingRequests.filter(
              (r) => r._id !== friendId
            );
            await this.loadAllUsers();
          } else {
            this.showMessage(data.error || data.message, "error");
          }
        } catch (err) {
          console.error("Error cancelling request:", err);
          this.showMessage("❌ Failed to cancel friend request.", "error");
        }
      },

      // Send friend request
      async sendFriendRequest(friendId) {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/friends/request/${friendId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          if (!res.ok) throw new Error(data.error || "Failed to send request");

          this.showMessage("✅ Friend request sent!", "success");
          await this.loadRequests();
        } catch (err) {
          console.error("Error sending friend request:", err);
          this.showMessage(err.message, "error");
        }
      },

      // 🗑️ Remove a friend
      async removeFriend(friendId) {
        if (!confirm("Are you sure you want to remove this friend?")) return;
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/friends/remove/${friendId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          if (res.ok) {
            this.showMessage("🗑️ Friend removed successfully!", "success");
            this.friends = this.friends.filter((f) => f._id !== friendId);
            await this.loadAllUsers();
          } else {
            this.showMessage(data.error || data.message, "error");
          }
        } catch (err) {
          console.error("Error removing friend:", err);
          this.showMessage("❌ Failed to remove friend.", "error");
        }
      },

      // Utility
      showMessage(message, type = "info") {
        this.statusMessage = message;
        this.messageType = type;
        setTimeout(() => (this.statusMessage = ""), 3000);
      },

      // Friend check
      isFriend(user) {
        return this.friends.some((f) => f._id === user._id);
      },
    },
  };
</script>

<style scoped>
  .friends-page {
    max-width: 700px;
    margin: 2rem auto;
    padding: 2rem;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  h2 {
    text-align: center;
    color: #2e7d32;
    margin-bottom: 1.5rem;
  }

  .search-bar {
    text-align: center;
    margin-bottom: 1.5rem;
  }

    .search-bar input {
      width: 80%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }

  .user-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .user-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    background: #f9f9f9;
    transition: all 0.2s;
  }

    .user-card:hover {
      background: #f1f1f1;
    }

  .user-info h4 {
    margin: 0;
    color: #333;
  }

  .user-info p {
    margin: 0;
    color: #777;
    font-size: 0.9rem;
  }

  .add-btn,
  .accept-btn,
  .cancel-btn,
  .remove-btn {
    background: #2e7d32;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    margin-left: 4px;
  }

    .add-btn:hover,
    .accept-btn:hover,
    .cancel-btn:hover,
    .remove-btn:hover {
      background: #1b5e20;
    }

  .badge {
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .friend {
    background: #c8e6c9;
    color: #256029;
  }

  .pending {
    background: #fff3cd;
    color: #856404;
  }

  .message-box {
    text-align: center;
    margin-top: 1rem;
    font-weight: 500;
  }

  .success {
    color: #388e3c;
  }

  .error {
    color: #d32f2f;
  }
</style>
