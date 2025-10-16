interface PlaceDetails {
  name: string;
  address: string;
  rating: number;
  priceLevel: number;
  openingHours: string[];
  isOpenNow: boolean;
  currentWaitTime?: number;
  photos: string[];
  reviews: Array<{
    rating: number;
    text: string;
    time: string;
  }>;
}

interface WeatherInfo {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{
    date: string;
    condition: string;
    high: number;
    low: number;
  }>;
}

export class RealTimeDataService {
  private static instance: RealTimeDataService;
  private googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  private weatherApiKey = import.meta.env.VITE_WEATHER_API_KEY || '';

  static getInstance(): RealTimeDataService {
    if (!RealTimeDataService.instance) {
      RealTimeDataService.instance = new RealTimeDataService();
    }
    return RealTimeDataService.instance;
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,price_level,opening_hours,photos,reviews&key=${this.googleApiKey}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch place details');
      
      const data = await response.json();
      const place = data.result;
      
      return {
        name: place.name,
        address: place.formatted_address,
        rating: place.rating || 0,
        priceLevel: place.price_level || 2,
        openingHours: place.opening_hours?.weekday_text || [],
        isOpenNow: place.opening_hours?.open_now || false,
        currentWaitTime: await this.getWaitTime(placeId),
        photos: place.photos?.map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.googleApiKey}`
        ) || [],
        reviews: place.reviews?.slice(0, 3).map((review: any) => ({
          rating: review.rating,
          text: review.text,
          time: review.relative_time_description
        })) || []
      };
    } catch (error) {
      console.error('Error fetching place details:', error);
      return this.getFallbackPlaceDetails();
    }
  }

  async getCurrentWeather(location: string): Promise<WeatherInfo> {
    try {
      // Using OpenWeatherMap API (replace with your preferred weather service)
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${this.weatherApiKey}&units=metric`
      );
      
      if (!response.ok) throw new Error('Failed to fetch weather');
      
      const data = await response.json();
      
      // Get forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${this.weatherApiKey}&units=metric`
      );
      
      const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;
      
      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main.toLowerCase(),
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        forecast: forecastData?.list?.slice(0, 5).map((item: any) => ({
          date: new Date(item.dt * 1000).toLocaleDateString(),
          condition: item.weather[0].main.toLowerCase(),
          high: Math.round(item.main.temp_max),
          low: Math.round(item.main.temp_min)
        })) || []
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return this.getFallbackWeather();
    }
  }

  async getWaitTime(placeId: string): Promise<number> {
    // Mock implementation - replace with real wait time API
    const hour = new Date().getHours();
    if (hour >= 12 && hour <= 14) return 25; // Lunch rush
    if (hour >= 18 && hour <= 20) return 30; // Dinner rush
    return Math.floor(Math.random() * 15) + 5; // 5-20 minutes
  }

  async getCrowdLevel(placeId: string): Promise<string> {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    // Weekend logic
    if (day === 0 || day === 6) {
      if (hour >= 10 && hour <= 16) return 'Very Busy';
      if (hour >= 17 && hour <= 20) return 'Busy';
      return 'Quiet';
    }
    
    // Weekday logic
    if (hour >= 12 && hour <= 14) return 'Busy';
    if (hour >= 17 && hour <= 19) return 'Very Busy';
    return 'Moderate';
  }

  async getTransportOptions(from: string, to: string): Promise<Array<{
    mode: string;
    duration: string;
    cost: string;
    instructions: string;
  }>> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&mode=transit&alternatives=true&key=${this.googleApiKey}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch directions');
      
      const data = await response.json();
      
      return data.routes?.slice(0, 3).map((route: any) => ({
        mode: this.getTransportMode(route),
        duration: route.legs[0].duration.text,
        cost: this.estimateTransportCost(route),
        instructions: route.legs[0].steps[0].html_instructions.replace(/<[^>]*>/g, '')
      })) || this.getFallbackTransport();
    } catch (error) {
      console.error('Error fetching transport options:', error);
      return this.getFallbackTransport();
    }
  }

  private getTransportMode(route: any): string {
    const steps = route.legs[0].steps;
    if (steps.some((step: any) => step.travel_mode === 'TRANSIT')) return 'metro';
    if (steps.some((step: any) => step.travel_mode === 'WALKING')) return 'walk';
    return 'taxi';
  }

  private estimateTransportCost(route: any): string {
    const distance = route.legs[0].distance.value / 1000; // km
    if (distance < 1) return 'Free';
    if (distance < 5) return '€2-5';
    if (distance < 10) return '€5-12';
    return '€12-25';
  }

  private getFallbackPlaceDetails(): PlaceDetails {
    return {
      name: 'Local Attraction',
      address: 'City Center',
      rating: 4.2,
      priceLevel: 2,
      openingHours: ['Open daily 9:00 AM - 6:00 PM'],
      isOpenNow: true,
      photos: [],
      reviews: []
    };
  }

  private getFallbackWeather(): WeatherInfo {
    return {
      temperature: 22,
      condition: 'partly cloudy',
      humidity: 65,
      windSpeed: 10,
      forecast: []
    };
  }

  private getFallbackTransport(): Array<{mode: string, duration: string, cost: string, instructions: string}> {
    return [
      { mode: 'walk', duration: '15 min', cost: 'Free', instructions: 'Walk via main street' },
      { mode: 'metro', duration: '8 min', cost: '€2', instructions: 'Take Line 1 to next station' }
    ];
  }

  // Utility method to get personalized recommendations
  async getPersonalizedRecommendations(interests: string[], budget: string, location: string): Promise<string[]> {
    const recommendations = [];
    
    if (interests.includes('food')) {
      recommendations.push('Try the local specialty dish at highly-rated restaurants');
    }
    if (interests.includes('culture')) {
      recommendations.push('Visit during off-peak hours for better experience');
    }
    if (interests.includes('nature')) {
      const weather = await this.getCurrentWeather(location);
      if (weather.condition === 'sunny') {
        recommendations.push('Perfect weather for outdoor activities');
      }
    }
    
    if (budget === 'budget-friendly') {
      recommendations.push('Look for free walking tours and public parks');
    }
    
    return recommendations;
  }
}

export const realTimeDataService = RealTimeDataService.getInstance();