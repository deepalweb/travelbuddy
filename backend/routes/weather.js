const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get current weather using Google Weather API
router.get('/current', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google API key not configured' });
    }

    const response = await axios.post(
      `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`,
      {
        location: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        },
        languageCode: 'en'
      }
    );

    const data = response.data;
    
    res.json({
      temperature: Math.round(data.temperature?.value || 28),
      condition: data.weatherCode?.toLowerCase() || 'sunny',
      humidity: data.humidity || 65,
      windSpeed: data.windSpeed?.value || 12,
      uvIndex: data.uvIndex || 5,
      feelsLike: Math.round(data.feelsLike?.value || data.temperature?.value || 28)
    });
  } catch (error) {
    console.error('Google Weather API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get weather forecast using Google Weather API
router.get('/forecast', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google API key not configured' });
    }

    const response = await axios.post(
      `https://weather.googleapis.com/v1/forecast:lookup?key=${apiKey}`,
      {
        location: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        },
        languageCode: 'en'
      }
    );

    const hourly = response.data.hourlyForecasts?.slice(0, 8).map(item => ({
      time: new Date(item.time),
      temperature: Math.round(item.temperature?.value || 28),
      condition: item.weatherCode?.toLowerCase() || 'clear',
      precipitation: item.precipitationProbability || 0
    })) || [];

    res.json({ hourly });
  } catch (error) {
    console.error('Google Weather forecast API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

module.exports = router;
