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
          <span v-if="isFriend(user)" class="badge friend">✅ Friends</span>
          <div v-else-if="pendingRequests.some((r) => r._id === user._id)">
            <button @click="acceptRequest(user._id)" class="accept-btn">✅ Accept</button>
            <button @click="cancelRequest(user._id)" class="cancel-btn">❌ Cancel</button>
          </div>

          <span v-else-if="user.friendRequests?.includes(currentUserId)" class="badge pending">
            ⏳ Request Sent
          </span>
          <button v-else
                  @click="sendFriendRequest(user._id)"
                  class="add-btn">
            ➕ Add Friend
          </button>
        </div>
      </div>
    </div>

    <p v-else>No users found.</p>

    <div v-if="statusMessage" :class="messageType" class="message-box">
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
      async acceptRequest(friendId) {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${ API_BASE }/friends/accept/${ friendId }`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ token }`,
            "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if(res.ok) {
    this.showMessage("✅ Friend request accepted!");
    await this.loadFriends();
    await this.loadRequests();
  } else {
    this.showMessage(  data.error || data.message );
  }
    } catch (err) {
    console.error("Error accepting request:", err);
    this.showMessage("❌ Failed to accept friend request.");
  }
      },
      showMessage(message) {
        this.statusMessage = message;
        setTimeout(() => (this.statusMessage = ""), 3000);
      },
      async cancelRequest(friendId) {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${ API_BASE }/friends/cancel/${ friendId }`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${ token }`,
            "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if(res.ok) {
    this.showMessage("❌ Friend request cancelled!");
        this.pendingRequests = this.pendingRequests.filter(
          (r) => r._id !== friendId
        );
        this.users = this.users.map((user) => {
          if (user._id === friendId) {
            // Reset their request indicators
            return { ...user, friendRequests: [], sentRequests: [] };
          }
          return user;
        });

        // Optionally reload lists from backend to ensure sync
        await new Promise(r => setTimeout(r, 700));
        await this.loadRequests();
        await this.loadAllUsers();
  } else {
    this.showMessage(data.error || data.message);
  }
    } catch (err) {
    console.error("Error cancelling request:", err);
    this.showMessage("❌ Failed to cancel friend request.");
  }
  },


      async loadFriends() {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/friends/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        this.friends = data.friends || [];
      },

      async loadRequests() {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/friends/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        this.pendingRequests = data.pendingRequests || [];
      },

      isFriend(user) {
        return this.friends.some((f) => f._id === user._id);
      },

      isRequestPending(user) {
        // True if this user has sent a request to the other user
        const hasSent = user.friendRequests?.some((r) => r === this.currentUserId);
        // True if this user has received a request from the other user
        const hasReceived = this.pendingRequests.some((r) => r._id === user._id);
        return hasSent || hasReceived;
      },

      async sendFriendRequest(friendId) {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/friends/request/${friendId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          if (!res.ok) throw new Error(data.error || "Failed to send request");

          this.statusMessage = data.message || "Friend request sent!";
          this.messageType = "success";

          // Refresh lists
          await this.loadRequests();
        } catch (err) {
          console.error("Error sending friend request:", err);
          this.statusMessage = err.message;
          this.messageType = "error";
        }
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

  .add-btn {
    background: #2e7d32;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
  }

    .add-btn:hover {
      background: #1b5e20;
    }
  .cancel-btn {
    background: #2e7d32;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
  }

    .cancel-btn:hover {
      background: #1b5e20;
    }
  .accept-btn {
    background: #2e7d32;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
  }

    .accept-btn:hover {
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
