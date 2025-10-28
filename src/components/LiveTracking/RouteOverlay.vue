<script>
import L from 'leaflet';

export default {
  name: 'RouteOverlay',

  props: {
    map: {
      type: Object,
      required: true
    },
    fastestRoute: {
      type: Object,
      required: true
    },
    greenestRoute: {
      type: Object,
      default: null
    },
    selectedRoute: {
      type: String,
      default: 'fastest'
    },
    showGreenest: {
      type: Boolean,
      default: false
    }
  },

  emits: ['route-clicked'],

  data() {
    return {
      fastestPolyline: null,
      greenestPolyline: null
    };
  },

  watch: {
    map(newMap) {
      if (newMap && this.fastestRoute) {
        this.drawRoutes();
      }
    },
    fastestRoute() {
      if (this.map) this.drawRoutes();
    },
    greenestRoute() {
      if (this.map) this.drawRoutes();
    },
    selectedRoute() {
      if (this.map) this.updateSelection();
    }
  },

  mounted() {
    this.drawRoutes();
  },

  beforeUnmount() {
    this.clearRoutes();
  },

  methods: {
    drawRoutes() {
      if (!this.map || !this.fastestRoute) return;

      // Clear existing routes
      this.clearRoutes();

      // Draw fastest route (blue)
      const fastestCoords = this.fastestRoute.path_coordinates.map(
        coord => [coord.lat, coord.lon]
      );

      this.fastestPolyline = L.polyline(fastestCoords, {
        color: '#4285F4',
        weight: 5,
        opacity: this.selectedRoute === 'fastest' ? 1.0 : 0.5
      }).addTo(this.map);

      // Add click handler
      this.fastestPolyline.on('click', () => {
        this.$emit('route-clicked', 'fastest');
      });

      // Draw greenest route (green) if available
      if (this.showGreenest && this.greenestRoute) {
        const greenestCoords = this.greenestRoute.path_coordinates.map(
          coord => [coord.lat, coord.lon]
        );

        this.greenestPolyline = L.polyline(greenestCoords, {
          color: '#34A853',
          weight: 5,
          opacity: this.selectedRoute === 'greenest' ? 1.0 : 0.4
        }).addTo(this.map);

        // Add click handler
        this.greenestPolyline.on('click', () => {
          this.$emit('route-clicked', 'greenest');
        });
      }

      // Fit map to show all routes
      this.fitBounds();
    },

    updateSelection() {
      if (!this.fastestPolyline) return;

      // Update fastest route style
      this.fastestPolyline.setStyle({
        opacity: this.selectedRoute === 'fastest' ? 1.0 : 0.5,
        weight: this.selectedRoute === 'fastest' ? 6 : 5
      });

      // Update greenest route style
      if (this.greenestPolyline) {
        this.greenestPolyline.setStyle({
          opacity: this.selectedRoute === 'greenest' ? 1.0 : 0.4,
          weight: this.selectedRoute === 'greenest' ? 6 : 5
        });
      }
    },

    fitBounds() {
      const allCoords = [
        ...this.fastestRoute.path_coordinates
      ];

      if (this.greenestRoute && this.greenestRoute.path_coordinates) {
        allCoords.push(...this.greenestRoute.path_coordinates);
      }

      if (allCoords.length > 0) {
        const latLngs = allCoords.map(c => [c.lat, c.lon]);
        const bounds = L.latLngBounds(latLngs);
        this.map.fitBounds(bounds, { padding: [50, 50] });
      }
    },

    clearRoutes() {
      if (this.fastestPolyline) {
        this.map.removeLayer(this.fastestPolyline);
        this.fastestPolyline = null;
      }

      if (this.greenestPolyline) {
        this.map.removeLayer(this.greenestPolyline);
        this.greenestPolyline = null;
      }
    }
  }
};
</script>
