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
      fastestPolylines: [],
      greenestPolylines: [],
      startMarker: null,
      destMarker: null,
      modeColors: {
        car: '#FF5722',      // Red-Orange
        walk: '#4CAF50',     // Green
        train: '#2196F3',    // Blue
        tram: '#9C27B0',     // Purple
        bus: '#FF9800'       // Orange
      }
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

        // Draw fastest route with segments by mode
        if (this.fastestRoute.segments) {
          console.log('⚡ Drawing fastest route segments:', this.fastestRoute.segments.length);
          this.drawSegmentedRoute(this.fastestRoute.segments, 'fastest');
        }

        // Draw greenest route with segments if available
        if (this.showGreenest && this.greenestRoute && this.greenestRoute.segments) {
          console.log('🌱 Drawing greenest route segments:', this.greenestRoute.segments.length);
          this.drawSegmentedRoute(this.greenestRoute.segments, 'greenest');
        }

        // Fit map to show all routes
        this.fitBounds();

      } catch (error) {
        console.error('❌ Error drawing routes:', error);
      }
    },

    drawSegmentedRoute(segments, routeType) {
      const isSelected = this.selectedRoute === routeType;
      const opacity = isSelected ? 0.9 : 0.4;
      const weight = isSelected ? 7 : 5;

      segments.forEach((segment) => {
        const coords = [
          [segment.from_lat, segment.from_lon],
          [segment.to_lat, segment.to_lon]
        ];

        const color = this.modeColors[segment.mode] || '#4285F4';

        const polyline = L.polyline(coords, {
          color: color,
          weight: weight,
          opacity: opacity,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(this.map);

        // Add popup with segment info
        polyline.bindPopup(`
          <b>${this.getModeIcon(segment.mode)} ${segment.mode.toUpperCase()}</b><br/>
          Distance: ${segment.distance_km.toFixed(2)} km<br/>
          Time: ${segment.time_min.toFixed(1)} min<br/>
          Emissions: ${segment.emissions_kg.toFixed(3)} kg CO₂
        `);

        // Add click handler
        polyline.on('click', () => {
          console.log(`${routeType} route segment clicked:`, segment.mode);
          this.$emit('route-clicked', routeType);
        });

        // Store polylines for later updates
        if (routeType === 'fastest') {
          this.fastestPolylines.push(polyline);
        } else {
          this.greenestPolylines.push(polyline);
        }
      });

      console.log(`✅ ${routeType} route drawn with ${segments.length} segments`);
    },

    updateSelection() {
      console.log('🔄 Updating route selection to', this.selectedRoute);

      // Update fastest route segments
      this.fastestPolylines.forEach(polyline => {
        const isSelected = this.selectedRoute === 'fastest';
        polyline.setStyle({
          opacity: isSelected ? 0.9 : 0.4,
          weight: isSelected ? 7 : 5
        });
      });

      // Update greenest route segments
      this.greenestPolylines.forEach(polyline => {
        const isSelected = this.selectedRoute === 'greenest';
        polyline.setStyle({
          opacity: isSelected ? 0.9 : 0.4,
          weight: isSelected ? 7 : 5
        });
      });

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

      // Clear fastest polylines
      this.fastestPolylines.forEach(polyline => {
        this.map.removeLayer(polyline);
      });
      this.fastestPolylines = [];

      // Clear greenest polylines
      this.greenestPolylines.forEach(polyline => {
        this.map.removeLayer(polyline);
      });
      this.greenestPolylines = [];

      if (this.startMarker) {
        this.map.removeLayer(this.startMarker);
        this.startMarker = null;
      }

      if (this.destMarker) {
        this.map.removeLayer(this.destMarker);
        this.destMarker = null;
      }
    },

    getModeIcon(mode) {
      const icons = {
        car: '🚗',
        walk: '🚶',
        train: '🚆',
        tram: '🚊',
        bus: '🚌'
      };
      return icons[mode] || '🚶';
    }
  }
};
</script>
