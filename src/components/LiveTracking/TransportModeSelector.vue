<template>
  <div class="transport-mode-selector">
    <p class="selector-label">Include in route:</p>

    <div class="mode-checkboxes">
      <label
        v-for="mode in availableModes"
        :key="mode.id"
        class="mode-checkbox"
      >
        <input
          type="checkbox"
          :value="mode.id"
          v-model="selectedModes"
          @change="updateModes"
        />
        <span class="mode-icon">{{ mode.icon }}</span>
        <span class="mode-name">{{ mode.name }}</span>
      </label>
    </div>

    <p v-if="selectedModes.length === 0" class="warning">
      ⚠️ Select at least one transport mode
    </p>
  </div>
</template>

<script>
export default {
  name: 'TransportModeSelector',

  props: {
    modelValue: {
      type: Array,
      default: () => ['car', 'walk', 'train', 'tram', 'bus']
    }
  },

  emits: ['update:modelValue'],

  data() {
    return {
      availableModes: [
        { id: 'car', name: 'Car', icon: '🚗' },
        { id: 'walk', name: 'Walk', icon: '🚶' },
        { id: 'train', name: 'Train', icon: '🚆' },
        { id: 'tram', name: 'Tram', icon: '🚊' },
        { id: 'bus', name: 'Bus', icon: '🚌' }
      ],
      selectedModes: [...this.modelValue]
    };
  },

  watch: {
    modelValue(newVal) {
      this.selectedModes = [...newVal];
    }
  },

  methods: {
    updateModes() {
      // Ensure at least one mode is selected
      if (this.selectedModes.length > 0) {
        this.$emit('update:modelValue', this.selectedModes);
      } else {
        // Revert to previous selection if trying to uncheck all
        this.selectedModes = [...this.modelValue];
      }
    }
  }
};
</script>

<style scoped>
.transport-mode-selector {
  margin: 15px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.selector-label {
  margin: 0 0 12px 0;
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.mode-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.mode-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.mode-checkbox:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.mode-checkbox input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.mode-checkbox input[type="checkbox"]:checked + .mode-icon {
  transform: scale(1.2);
}

.mode-icon {
  font-size: 18px;
  transition: transform 0.2s;
}

.mode-name {
  font-weight: 500;
  color: #333;
}

.warning {
  margin: 12px 0 0 0;
  padding: 8px 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  font-size: 13px;
  color: #856404;
}
</style>
