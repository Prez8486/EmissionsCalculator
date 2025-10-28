/**
 * PlannedRoute - Data model for calculated routes from backend
 */
class PlannedRoute {
  constructor(backendResponse) {
    // Store fastest route data
    this.fastest = {
      ...backendResponse.routes.fastest.summary,
      path_coordinates: backendResponse.routes.fastest.path_coordinates,
      segments: backendResponse.routes.fastest.segments
    };

    // Store greenest route data if available
    if (backendResponse.routes.greenest) {
      this.greenest = {
        ...backendResponse.routes.greenest.summary,
        path_coordinates: backendResponse.routes.greenest.path_coordinates,
        segments: backendResponse.routes.greenest.segments,
        comparison: backendResponse.routes.greenest.comparison || null
      };
    } else {
      this.greenest = null;
    }

    // Store metadata
    this.show_alternative = backendResponse.show_alternative || false;
    this.greenest_rejected_reason = backendResponse.greenest_rejected_reason || null;
    this.snap_info = backendResponse.snap_info || null;
    this.request_info = backendResponse.request_info || null;
  }

  /**
   * Get route data by type
   * @param {string} type - 'fastest' or 'greenest'
   * @returns {Object} Route data
   */
  getRoute(type) {
    if (type === 'greenest' && this.greenest) {
      return this.greenest;
    }
    return this.fastest;
  }

  /**
   * Calculate emissions savings by choosing greenest
   * @returns {number} Emissions saved in kg CO₂
   */
  getEmissionsSavings() {
    if (!this.greenest) return 0;
    return this.fastest.total_emissions_kg - this.greenest.total_emissions_kg;
  }

  /**
   * Calculate time difference between routes
   * @returns {number} Time difference in minutes
   */
  getTimeDifference() {
    if (!this.greenest) return 0;
    return this.greenest.total_time_min - this.fastest.total_time_min;
  }

  /**
   * Get percentage of emissions saved
   * @returns {number} Percentage saved
   */
  getEmissionsSavingsPercent() {
    if (!this.greenest || this.fastest.total_emissions_kg === 0) return 0;
    return (this.getEmissionsSavings() / this.fastest.total_emissions_kg) * 100;
  }

  /**
   * Check if greenest route is significantly better
   * @returns {boolean}
   */
  isGreenestWorthIt() {
    return this.show_alternative && this.getEmissionsSavings() > 0.05; // More than 50g savings
  }
}

export default PlannedRoute;
