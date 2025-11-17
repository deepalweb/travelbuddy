// Shared API configuration
const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/v1'
    : 'http://localhost:5000/api/v1',
  
  ENDPOINTS: {
    PLACES: '/places/search',
    DEALS: '/deals', 
    SUGGESTIONS: '/suggestions/personalized',
    HEALTH: '/health',
    CONNECTIVITY: '/connectivity'
  },
  
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

module.exports = API_CONFIG;