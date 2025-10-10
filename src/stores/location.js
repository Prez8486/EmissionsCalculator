//used to store the location permissions accross different pages
import { defineStore } from 'pinia';

export const useLocationStore = defineStore('location', {
  state: () => ({
    permissionGranted: false,  // This tracks runtime permission status
    trackingEnabled: true      // This tracks whether the user *wants* tracking
  }),
  actions: {
    setPermission(granted) {
      this.permissionGranted = granted;
    },
    toggleTracking() {
      this.trackingEnabled = !this.trackingEnabled;
    },
    enableTracking() {
      this.trackingEnabled = true;
    },
    disableTracking() {
      this.trackingEnabled = false;
    }
  }
});
