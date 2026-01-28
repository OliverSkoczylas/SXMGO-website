// API Client - Use this to make secure API calls through your serverless backend
// The API key never leaves the server

const ApiClient = {
  /**
   * Make a secure API call through the serverless proxy
   * @param {string} endpoint - The third-party API endpoint
   * @param {object} data - The data to send
   * @returns {Promise<object>} - The API response
   */
  async call(endpoint, data = {}) {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint, data }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  // Example: Get map data
  async getMapLocations() {
    return this.call('https://api.example.com/locations', {
      region: 'st-maarten',
    });
  },

  // Example: Submit check-in
  async submitCheckIn(locationId, userId) {
    return this.call('https://api.example.com/checkin', {
      locationId,
      userId,
      timestamp: new Date().toISOString(),
    });
  },
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}
