import { BaseTrip } from './BaseTrip.js';

export class ManualTrip extends BaseTrip {
  constructor(transportMode, userId, options = {}) {
    super(transportMode, userId, options);

    // Manual trip doesn't auto-save
    this.autoSave = false;

    // Form state
    this.formTouched = false;
    this.fieldErrors = {};
  }

  // Manual trips don't have a "start" - they begin when form is loaded
  async startTrip() {
    this.isActive = true;
    this.onStateChange({
      isActive: true,
      mode: 'manual',
      message: `Enter ${this.config.name} trip details manually`
    });
    return true;
  }

  // Manual trips "end" when user clicks calculate
  async endTrip() {
    // For manual trips, "end" just means calculate emissions
    // NO AUTO-SAVE (that's the key difference from LiveTrip)
    const calculated = await this.calculateEmissions();

    if (calculated) {
      this.isActive = false;
      this.onStateChange({
        isActive: false,
        calculated: true,
        message: `${this.config.name} emissions calculated. Click 'Save to History' to save.`
      });
    }

    return calculated;
  }

  // Validate individual field
  validateField(fieldName, value) {
    const fieldConfig = this.config.fields[fieldName];
    const validationRules = this.config.validation;

    // Clear existing error
    delete this.fieldErrors[fieldName];

    // Check required
    if (validationRules.required.includes(fieldName)) {
      if (!value || value === '') {
        this.fieldErrors[fieldName] = `${fieldConfig.label} is required`;
        return false;
      }
    }

    // Check field-specific validation
    if (fieldConfig.min !== undefined && value < fieldConfig.min) {
      this.fieldErrors[fieldName] = `${fieldConfig.label} must be at least ${fieldConfig.min}`;
      return false;
    }

    if (fieldConfig.max !== undefined && value > fieldConfig.max) {
      this.fieldErrors[fieldName] = `${fieldConfig.label} cannot exceed ${fieldConfig.max}`;
      return false;
    }

    // Check custom validation
    if (validationRules.custom && validationRules.custom[fieldName]) {
      const error = validationRules.custom[fieldName](value);
      if (error) {
        this.fieldErrors[fieldName] = error;
        return false;
      }
    }

    return true;
  }

  // Update a single field with validation
  updateField(fieldName, value) {
    this.formTouched = true;
    this.data[fieldName] = value;

    // Validate field in real-time
    this.validateField(fieldName, value);

    this.onDataUpdate({
      [fieldName]: value,
      fieldErrors: { ...this.fieldErrors }
    });
  }

  // Batch update multiple fields
  updateFields(updates) {
    this.formTouched = true;

    Object.entries(updates).forEach(([fieldName, value]) => {
      this.data[fieldName] = value;
      this.validateField(fieldName, value);
    });

    this.onDataUpdate({
      ...updates,
      fieldErrors: { ...this.fieldErrors }
    });
  }

  // Enhanced validation for manual forms
  validate() {
    const baseValid = super.validate();

    // Add manual-specific validation
    if (this.transportMode === 'flight') {
      // Validate airports are different
      if (this.data.fromAirport && this.data.toAirport &&
          this.data.fromAirport === this.data.toAirport) {
        this.errors.airports = 'From and To airports must be different';
      }
    }

    // Combine base errors with field errors
    this.errors = { ...this.errors, ...this.fieldErrors };

    return Object.keys(this.errors).length === 0;
  }

  // Manual save (called when user clicks "Save to History")
  async saveTrip() {
    if (!this.emission) {
      this.onError('No data to save', 'Please calculate emissions first');
      return false;
    }

    const saved = await super.saveTrip();

    if (saved) {
      this.onStateChange({
        manualSaved: true,
        message: `${this.config.name} trip saved to history!`
      });
    }

    return saved;
  }

  // Get form configuration for UI
  getFormConfig() {
    return {
      fields: this.config.fields,
      validation: this.config.validation,
      plugins: this.config.plugins,
      transportMode: this.transportMode,
      name: this.config.name,
      icon: this.config.icon
    };
  }

  // Get field value with type conversion
  getFieldValue(fieldName) {
    const value = this.data[fieldName];
    const fieldConfig = this.config.fields[fieldName];

    if (!fieldConfig) return value;

    switch (fieldConfig.type) {
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      case 'checkbox':
        return Boolean(value);
      default:
        return value;
    }
  }

  // Check if field should be readonly
  isFieldReadonly(fieldName) {
    const fieldConfig = this.config.fields[fieldName];
    return fieldConfig?.readonly === true;
  }

  // Check if form is valid for submission
  canCalculate() {
    return this.formTouched &&
           Object.keys(this.fieldErrors).length === 0 &&
           this.config.validation.required.every(field =>
             this.data[field] && this.data[field] !== ''
           );
  }

  // Check if trip can be saved
  canSave() {
    return this.emission !== null && !this.loading;
  }

  // Reset form to initial state
  resetForm() {
    this.reset();
    this.formTouched = false;
    this.fieldErrors = {};
    this.onStateChange({
      formReset: true,
      message: 'Form reset to default values'
    });
  }

  // Get form data formatted for display
  getFormData() {
    const formData = {};

    Object.entries(this.config.fields).forEach(([fieldName, fieldConfig]) => {
      formData[fieldName] = {
        value: this.getFieldValue(fieldName),
        config: fieldConfig,
        error: this.fieldErrors[fieldName] || null,
        readonly: this.isFieldReadonly(fieldName)
      };
    });

    return formData;
  }

  // Get trip summary for manual trips
  getTripSummary() {
    const summary = this.getState();

    return {
      ...summary,
      mode: 'manual',
      formTouched: this.formTouched,
      canCalculate: this.canCalculate(),
      canSave: this.canSave(),
      formData: this.getFormData()
    };
  }
}
