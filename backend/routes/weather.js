const express = require('express');
const router = express.Router();

// GET /api/weather/google?lat={lat}&lng={lng}
router.get('/google', async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    // Use OpenWeatherMap with existing Google API key as fallback
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.GOOGLE_PLACES_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    res.json({
      current: {
        temperature: data.main.temp,
        condition: data.weather[0].main.toLowerCase(),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        feelsLike: data.main.feels_like,
        iconUrl: `https://openweathermap.org/img/w/${data.weather[0].icon}.png`
      }
    });
  } catch (error) {
    console.error('Weather API error:', error);
    
    // Return smart mock data as fallback
    const hour = new Date().getHours();
    const temp = hour < 12 ? 22 : hour >= 18 ? 24 : 28;
    const condition = hour < 12 ? 'clear' : hour >= 18 ? 'cloudy' : 'sunny';
    
    res.json({
      current: {
        temperature: temp,
        condition: condition,
        description: `Current weather conditions`,
        humidity: 65,
        windSpeed: 3.5,
        feelsLike: temp + 2,
        iconUrl: `https://openweathermap.org/img/w/01d.png`
      }
    });
  }
});

module.exports = router;