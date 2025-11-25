const express = require('express');
const router = express.Router();

// GET /api/weather/current?lat={lat}&lng={lng}
router.get('/current', async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    const response = await fetch(
      `https://weather.googleapis.com/v1/currentConditions:lookup?key=${process.env.GOOGLE_PLACES_API_KEY}&location.latitude=${lat}&location.longitude=${lng}`,
      { headers: { 'X-Goog-FieldMask': 'temperature,humidity,windSpeed,weatherCode,cloudCover' } }
    );
    
    if (!response.ok) throw new Error(`Weather API returned ${response.status}`);
    
    const data = await response.json();
    const temp = data.temperature?.value || 28;
    const condition = _mapWeatherCode(data.weatherCode);
    
    res.json({
      temperature: temp,
      condition: condition,
      humidity: data.humidity?.value || 65,
      windSpeed: data.windSpeed?.value || 12,
      feelsLike: temp + 2,
      cloudCover: data.cloudCover?.value || 20
    });
  } catch (error) {
    console.error('Weather API error:', error);
    const hour = new Date().getHours();
    res.json({
      temperature: hour < 12 ? 22 : hour >= 18 ? 24 : 28,
      condition: hour < 12 ? 'clear' : hour >= 18 ? 'cloudy' : 'sunny',
      humidity: 65,
      windSpeed: 12,
      feelsLike: 30,
      cloudCover: 20
    });
  }
});

// GET /api/weather/forecast?lat={lat}&lng={lng}
router.get('/forecast', async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    const response = await fetch(
      `https://weather.googleapis.com/v1/forecast:lookup?key=${process.env.GOOGLE_PLACES_API_KEY}&location.latitude=${lat}&location.longitude=${lng}`,
      { headers: { 'X-Goog-FieldMask': 'hourlyForecasts.temperature,hourlyForecasts.weatherCode,hourlyForecasts.time' } }
    );
    
    if (!response.ok) throw new Error(`Forecast API returned ${response.status}`);
    
    const data = await response.json();
    const hourly = (data.hourlyForecasts || []).slice(0, 9).map(h => ({
      time: h.time,
      temperature: h.temperature?.value || 28,
      condition: _mapWeatherCode(h.weatherCode)
    }));
    
    res.json({ hourly });
  } catch (error) {
    console.error('Forecast API error:', error);
    res.json({ hourly: [] });
  }
});

function _mapWeatherCode(code) {
  if (!code) return 'sunny';
  if (code >= 200 && code < 300) return 'rainy';
  if (code >= 300 && code < 600) return 'rainy';
  if (code >= 600 && code < 700) return 'snowy';
  if (code >= 700 && code < 800) return 'cloudy';
  if (code === 800) return 'sunny';
  return 'cloudy';
}

module.exports = router;