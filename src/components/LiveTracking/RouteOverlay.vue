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
      greenestPolyline: null,
      startMarker: null,
      destMarker: null
    };
  },

  watch: {
    map: {
      handler(newMap) {
        console.log('🗺️ RouteOverlay: Map changed', !!newMap);
        if (newMap && this.fastestRoute) {
          this.drawRoutes();
        }
      },
      immediate: true
    },

    fastestRoute: {
      handler(newRoute) {
        console.log('⚡ RouteOverlay: Fastest route changed', !!newRoute);
        if (this.map && newRoute) {
          this.drawRoutes();
        }
      },
      immediate: true
    },

    greenestRoute: {
      handler(newRoute) {
        console.log('🌱 RouteOverlay: Greenest route changed', !!newRoute);
        if (this.map) {
          this.drawRoutes();
        }
      }
    },

    selectedRoute: {
      handler(newSelection) {
        console.log('✅ RouteOverlay: Selected route changed to', newSelection);
        if (this.map) {
          this.updateSelection();
        }
      }
    }
  },

  mounted() {
    console.log('🎬 RouteOverlay mounted', {
      hasMap: !!this.map,
      hasFastestRoute: !!this.fastestRoute,
      hasGreenestRoute: !!this.greenestRoute
    });

    if (this.map && this.fastestRoute) {
      this.drawRoutes();
    }
  },

  beforeUnmount() {
    console.log('🧹 RouteOverlay unmounting, cleaning routes');
    this.clearRoutes();
  },

  methods: {
    drawRoutes() {
      console.log('🎨 DrawRoutes called', {
        hasMap: !!this.map,
        hasFastestRoute: !!this.fastestRoute,
        hasGreenestRoute: !!this.greenestRoute
      });

      if (!this.map || !this.fastestRoute) {
        console.warn('⚠️ Cannot draw routes - missing map or fastest route');
        return;
      }

      // Clear existing routes first
      this.clearRoutes();

      try {
        // Draw start marker
        if (this.fastestRoute.path_coordinates && this.fastestRoute.path_coordinates.length > 0) {
          const startCoord = this.fastestRoute.path_coordinates[0];
          this.startMarker = L.marker([startCoord.lat, startCoord.lon], {
            icon: L.divIcon({
              html: '<div style="background: #4285F4; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
              className: 'start-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          }).addTo(this.map);
          this.startMarker.bindPopup('Start');
          console.log('📍 Start marker added');
        }

        // Draw destination marker
        if (this.fastestRoute.path_coordinates && this.fastestRoute.path_coordinates.length > 0) {
          const destCoord = this.fastestRoute.path_coordinates[this.fastestRoute.path_coordinates.length - 1];
          this.destMarker = L.marker([destCoord.lat, destCoord.lon], {
            icon: L.divIcon({
              html: '<div style="background: #EA4335; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
              className: 'dest-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          }).addTo(this.map);
          this.destMarker.bindPopup('Destination');
          console.log('🎯 Destination marker added');
        }

        // Draw fastest route (blue)
        const fastestCoords = this.fastestRoute.path_coordinates.map(
          coord => [coord.lat, coord.lon]
        );

        console.log('⚡ Drawing fastest route with', fastestCoords.length, 'coordinates');

        this.fastestPolyline = L.polyline(fastestCoords, {
          color: '#4285F4',
          weight: 6,
          opacity: this.selectedRoute === 'fastest' ? 1.0 : 0.5,
          lineJoin: 'round'
        }).addTo(this.map);

        // Add click handler
        this.fastestPolyline.on('click', () => {
          console.log('⚡ Fastest route clicked');
          this.$emit('route-clicked', 'fastest');
        });

        console.log('✅ Fastest route polyline added to map');

        // Draw greenest route (green) if available
        if (this.showGreenest && this.greenestRoute && this.greenestRoute.path_coordinates) {
          const greenestCoords = this.greenestRoute.path_coordinates.map(
            coord => [coord.lat, coord.lon]
          );

          console.log('🌱 Drawing greenest route with', greenestCoords.length, 'coordinates');

          this.greenestPolyline = L.polyline(greenestCoords, {
            color: '#34A853',
            weight: 6,
            opacity: this.selectedRoute === 'greenest' ? 1.0 : 0.4,
            lineJoin: 'round'
          }).addTo(this.map);

          // Add click handler
          this.greenestPolyline.on('click', () => {
            console.log('🌱 Greenest route clicked');
            this.$emit('route-clicked', 'greenest');
          });

          console.log('✅ Greenest route polyline added to map');
        }

        // Fit map to show all routes
        this.fitBounds();

      } catch (error) {
        console.error('❌ Error drawing routes:', error);
      }
    },

    updateSelection() {
      console.log('🔄 Updating route selection to', this.selectedRoute);

      if (!this.fastestPolyline) {
        console.warn('⚠️ No polylines to update');
        return;
      }

      // Update fastest route style
      this.fastestPolyline.setStyle({
        opacity: this.selectedRoute === 'fastest' ? 1.0 : 0.5,
        weight: this.selectedRoute === 'fastest' ? 8 : 6
      });

      // Update greenest route style
      if (this.greenestPolyline) {
        this.greenestPolyline.setStyle({
          opacity: this.selectedRoute === 'greenest' ? 1.0 : 0.4,
          weight: this.selectedRoute === 'greenest' ? 8 : 6
        });
      }

      console.log('✅ Route styles updated');
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
        console.log('🗺️ Map bounds fitted to routes');
      }
    },

    clearRoutes() {
      console.log('🧹 Clearing existing routes');

      if (this.fastestPolyline) {
        this.map.removeLayer(this.fastestPolyline);
        this.fastestPolyline = null;
      }

      if (this.greenestPolyline) {
        this.map.removeLayer(this.greenestPolyline);
        this.greenestPolyline = null;
      }

      if (this.startMarker) {
        this.map.removeLayer(this.startMarker);
        this.startMarker = null;
      }

      if (this.destMarker) {
        this.map.removeLayer(this.destMarker);
        this.destMarker = null;
      }
    }
  }
};
</script>
