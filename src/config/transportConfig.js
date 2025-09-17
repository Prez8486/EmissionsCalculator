export const transportConfig = {
  car: {
    name: "Car",
    icon: "🚗",

    //API configuration
    api: {
      emissions: 'emissioins/car/emissions',
      method: 'POST'
    },

    //Form Fields for Manual Mode
    fields: {
      distance: {
        type: 'number',
        label: 'Distance per Trip (km)',
        required: true,
        min: 0,
        readonly: true // GPS will populate this
      },
      trips: {
        type: 'number',
        label: 'Trips per Week',
        required: true,
        min: 1,
        default: 1
      },
      extraLoad: {
        type: 'select',
        label: 'Extra Load',
        options: [
          { value: 'none', label: 'None' },
          { value: 'caravan', label: 'Caravan' },
          { value: 'boat', label: 'Boat' },
          { value: 'trailer-light', label: 'Trailer (Light)' },
          { value: 'trailer-medium', label: 'Trailer (Medium)' },
          { value: 'trailer-heavy', label: 'Trailer (Heavy)' }
        ],
        default: 'none'
      }
    },

    //Validation Rules
    validation:{
      required: ['distance', 'vehicleMake', 'vehicleModel'],
      custom: {
        distance: (val) => val > 0 ? null : 'Distance must be greater than 0',
        trips: (val) => val >= 1 ? null : 'Must have at least 1 trip per week'
      }
    },

    //Plugin for API
    plugins: ['carAPI'],

    //GPS Tracking Settings
    gps: {
      enabled: true,
      updateInterval: 1000, // ms
      accuracy: 'high'
    },

    // Save Payload Mapping
    savePayload: (data) => ({
      transportMode: 'car',
      vehicleMake: data.vehicleMake,
      vehicleModel: data.vehicleModel,
      distanceKm: data.distance,
      trips: data.trips,
      extraLoad: data.extraLoad,
      emissionKg: data.emissionKg
    }),

    // Emissions Calculation Payload
    emissionsPayload: (data) => ({
      vehicleMake: data.vehicleMake,
      vehicleModel: data.vehicleModel,
      distanceKm: data.distance
    })
  },

  flight: {
    name: "Flight",
    icon: "✈️",

    api:{
      emissions: 'emissioins/flight/emissions',
      method: 'POST'
    },

    fields: {
      passengets: {
        type: 'number',
        label: 'Number of Passengers',
        required: true,
        min: 1,
        default: 1
      },
      flightClass: {
        type: 'select',
        label: 'Flight Class',
        options: [
          { value: 'economy', label: 'Economy' },
          { value: 'premium-economy', label: 'Premium Economy' },
          { value: 'business', label: 'Business' },
          { value: 'first', label: 'First Class' }
        ],
        default: 'economy'
      },
      roundTrip:{
        type: 'checkbox',
        label: 'Round Trip',
        default: false
      }
    },

    validation: {
      required: ['fromAirport', 'toAirport', 'passengers'],
      custom: {
        passengers: (val) => val >= 1 ? null : 'Must have at least 1 passenger',
        airports: (data) => data.fromAirport !== data.toAirport ? null : 'From and To airports must be different'
      }
    },

    plugins: ['flightAPI'],

    gps: {
      enabled: false // Flights don't use GPS tracking
    },

    savePayload: (data) => ({
      transportMode: 'flight',
      emissionKg: data.emissionKg,
      passengers: data.passengers,
      flightClass: data.flightClass,
      roundTrip: data.roundTrip,
      fromAirport: data.fromAirport,
      toAirport: data.toAirport,
      date: new Date().toISOString()
    }),

    emissionsPayload: (data) => ({
      fromAirport: data.fromAirport,
      toAirport: data.toAirport,
      passengers: data.passengers,
      flightClass: data.flightClass,
      roundTrip: data.roundTrip
    })
  },

  bus: {
    name: "Bus",
    icon: "🚌",

    api: {
      emissions: '/emissions/bus/emissions',
      method: 'POST'
    },

    fields: {
      distance: {
        type: 'number',
        label: 'Bus Distance Travelled (km)',
        required: true,
        min: 0,
        readonly: true // GPS will populate this
      }
    },

    validation: {
      required: ['distance'],
      custom: {
        distance: (val) => val > 0 ? null : 'Distance must be greater than 0'
      }
    },

    plugins: [], // No special APIs needed

    gps: {
      enabled: true,
      updateInterval: 1000,
      accuracy: 'high'
    },

    savePayload: (data) => ({
      transportMode: 'bus',
      distanceKm: data.distance,
      emissionKg: data.emissionKg
    }),

    emissionsPayload: (data) => ({
      distanceKm: data.distance
    })
  },

  metro: {
    name: 'Metro',
    icon: '🚇',

    api: {
      emissions: '/emissions/metro/emissions',
      method: 'POST'
    },

    fields: {
      distance: {
        type: 'number',
        label: 'Metro Distance Travelled (km)',
        required: true,
        min: 0,
        readonly: true
      }
    },

    validation: {
      required: ['distance'],
      custom: {
        distance: (val) => val > 0 ? null : 'Distance must be greater than 0'
      }
    },

    plugins: [],

    gps: {
      enabled: true,
      updateInterval: 1000,
      accuracy: 'high'
    },

    savePayload: (data) => ({
      transportMode: 'metro',
      distanceKm: data.distance,
      emissionKg: data.emissionKg
    }),

    emissionsPayload: (data) => ({
      distanceKm: data.distance
    })
  },

  tram: {
    name: 'Tram',
    icon: '🚋',

    api: {
      emissions: '/emissions/tram/emissions',
      method: 'POST'
    },

    fields: {
      distance: {
        type: 'number',
        label: 'Tram Distance Travelled (km)',
        required: true,
        min: 0,
        readonly: true
      }
    },

    validation: {
      required: ['distance'],
      custom: {
        distance: (val) => val > 0 ? null : 'Distance must be greater than 0'
      }
    },

    plugins: [],

    gps: {
      enabled: true,
      updateInterval: 1000,
      accuracy: 'high'
    },

    savePayload: (data) => ({
      transportMode: 'tram',
      distanceKm: data.distance,
      emissionKg: data.emissionKg
    }),

    emissionsPayload: (data) => ({
      distanceKm: data.distance
    })
  }
};

// Helper function to get config for a transport mode
export function getTransportConfig(mode) {
  const config = transportConfig[mode];
  if (!config) {
    throw new Error(`Unknown transport mode: ${mode}`);
  }
  return config;
}

// Helper function to validate required plugins are available
export function validatePlugins(mode, availablePlugins = []) {
  const config = getTransportConfig(mode);
  const missingPlugins = config.plugins.filter(plugin => !availablePlugins.includes(plugin));

  if (missingPlugins.length > 0) {
    throw new Error(`Missing required plugins for ${mode}: ${missingPlugins.join(', ')}`);
  }

  return true;
}
