/**
 * Environmental Impact Calculation Utilities
 * Provides functions to convert CO2 emissions into tangible environmental metrics
 */

/**
 * Calculate number of trees needed to offset emissions
 * Formula: 1 tree absorbs ~22kg CO2 per year
 */
export function calculateTreesNeeded(emissionsKg) {
  const CO2_PER_TREE_YEARLY = 22; // kg
  return Math.ceil(emissionsKg / CO2_PER_TREE_YEARLY);
}

/**
 * Calculate plastic bottle equivalent
 * Formula: 1 plastic bottle production = ~0.04kg CO2
 */
export function calculatePlasticBottles(emissionsKg) {
  const CO2_PER_BOTTLE = 0.04; // kg
  return Math.round(emissionsKg / CO2_PER_BOTTLE);
}

/**
 * Calculate sea-level rise contribution
 * Formula: 1 tonne CO2 contributes ~0.0015mm to global sea-level rise
 */
export function calculateSeaLevelRise(emissionsKg) {
  const MM_PER_TONNE = 0.0015; // mm
  const emissionsTonnes = emissionsKg / 1000;
  return parseFloat((emissionsTonnes * MM_PER_TONNE).toFixed(6));
}

/**
 * Calculate global temperature contribution
 * Formula: 1 tonne CO2 contributes ~0.0000015°C to global temperature
 */
export function calculateTemperatureImpact(emissionsKg) {
  const CELSIUS_PER_TONNE = 0.0000015; // °C
  const emissionsTonnes = emissionsKg / 1000;
  return parseFloat((emissionsTonnes * CELSIUS_PER_TONNE).toFixed(9));
}

/**
 * Calculate natural disaster frequency impact
 * Formula: Statistical correlation ~0.002% increase per tonne CO2
 */
export function calculateDisasterFrequency(emissionsKg) {
  const PERCENT_INCREASE_PER_TONNE = 0.00002; // 0.002%
  const emissionsTonnes = emissionsKg / 1000;
  return parseFloat((emissionsTonnes * PERCENT_INCREASE_PER_TONNE).toFixed(7));
}

/**
 * Calculate collective impact if entire Melbourne population made the same trip
 * @param {number} savingsKg - CO2 savings per trip in kg
 * @param {number} population - Population size (default: Melbourne ~5M)
 * @param {number} tripsPerYear - Average trips per person per year
 */
export function calculateMelbourneCollective(savingsKg, population = 5000000, tripsPerYear = 365) {
  const annualSavingsKg = savingsKg * population * tripsPerYear;
  const annualSavingsTonnes = annualSavingsKg / 1000;

  return {
    annual_savings_kg: annualSavingsKg,
    annual_savings_tonnes: Math.round(annualSavingsTonnes),
    trees_equivalent: calculateTreesNeeded(annualSavingsKg),
    plastic_bottles_equivalent: calculatePlasticBottles(annualSavingsKg),
    sea_level_prevented_mm: calculateSeaLevelRise(annualSavingsKg),
    temperature_prevented_celsius: calculateTemperatureImpact(annualSavingsKg),
    disaster_frequency_reduced: calculateDisasterFrequency(annualSavingsKg)
  };
}

/**
 * Format environmental impact data for display
 */
export function formatEnvironmentalImpact(emissionsKg) {
  return {
    trees: calculateTreesNeeded(emissionsKg),
    plastic_bottles: calculatePlasticBottles(emissionsKg),
    sea_level_mm: calculateSeaLevelRise(emissionsKg),
    temperature_celsius: calculateTemperatureImpact(emissionsKg),
    disaster_frequency_percent: calculateDisasterFrequency(emissionsKg)
  };
}

/**
 * Format large numbers for display (e.g., 1000000 -> 1M)
 */
export function formatLargeNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Get impact severity level based on emissions
 */
export function getImpactSeverity(emissionsKg) {
  if (emissionsKg < 1) return { level: 'low', color: '#28a745', label: 'Low Impact' };
  if (emissionsKg < 5) return { level: 'medium', color: '#ffc107', label: 'Medium Impact' };
  if (emissionsKg < 20) return { level: 'high', color: '#fd7e14', label: 'High Impact' };
  return { level: 'very-high', color: '#dc3545', label: 'Very High Impact' };
}
