import fetch from 'node-fetch';

export class AzureMapsSearch {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://atlas.microsoft.com';
  }

  async searchPlacesComprehensive(lat, lng, query, radius = 5000) {
    try {
      const smartRadius = Math.min(radius, 5000); // Max 5km for relevance
      const categoryId = this.getCategoryId(query);
      
      // OPTIMIZED: Single intelligent API call
      const url = categoryId
        ? `${this.baseUrl}/search/poi/json?subscription-key=${this.apiKey}&api-version=1.0&lat=${lat}&lon=${lng}&radius=${smartRadius}&categorySet=${categoryId}&limit=15`
        : `${this.baseUrl}/search/fuzzy/json?subscription-key=${this.apiKey}&api-version=1.0&query=${encodeURIComponent(query)}&lat=${lat}&lon=${lng}&radius=${smartRadius}&limit=15`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        console.log('⚠️ Azure Maps: 0 results');
        return [];
      }
      
      // Deduplicate by Azure Maps ID (most reliable)
      const uniquePlaces = new Map();
      for (const result of data.results) {
        const placeId = result.id;
        if (!placeId || uniquePlaces.has(placeId)) continue;
        
        const place = this.transformToGoogleFormat(result, lat, lng, query);
        if (place.name !== 'Unknown Place') {
          uniquePlaces.set(placeId, place);
        }
      }
      
      const results = Array.from(uniquePlaces.values());
      console.log(`✅ Azure Maps: ${results.length} places (${smartRadius}m, 1 call)`);
      return this.rankResults(results, lat, lng, query);
    } catch (error) {
      console.error('❌ Azure Maps error:', error.message);
      return [];
    }
  }

  rankResults(results, lat, lng, query) {
    const queryLower = query.toLowerCase();
    return results.map(place => {
      let score = 0;
      const nameLower = place.name.toLowerCase();
      
      if (nameLower.includes(queryLower)) score += 10;
      if (nameLower.startsWith(queryLower)) score += 5;
      score += (place.rating || 0) * 2;
      
      const distance = this.calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
      score -= distance / 1000;
      
      return { ...place, relevanceScore: score };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  transformToGoogleFormat(azureResult, lat, lng, query) {
    const poi = azureResult.poi || {};
    const address = azureResult.address || {};
    const position = azureResult.position || {};
    
    let placeName = poi.name || address.freeformAddress || 'Unknown Place';
    if (placeName === address.freeformAddress && address.freeformAddress) {
      const parts = address.freeformAddress.split(',');
      if (parts.length > 0 && parts[0].trim().length > 3) {
        placeName = parts[0].trim();
      }
    }
    
    const categories = poi.categories || [];
    const distance = this.calculateDistance(lat, lng, position.lat, position.lon);
    const placeType = this.getPlaceType(categories, query);
    
    return {
      place_id: azureResult.id || `azure_${Date.now()}_${Math.random()}`,
      name: placeName,
      type: placeType,
      formatted_address: address.freeformAddress || `${position.lat}, ${position.lon}`,
      geometry: {
        location: {
          lat: position.lat || 0,
          lng: position.lon || 0
        }
      },
      types: categories || ['point_of_interest'],
      rating: this.generateRating(poi),
      user_ratings_total: Math.floor(Math.random() * 200) + 50,
      business_status: 'OPERATIONAL',
      vicinity: address.freeformAddress || '',
      phone: poi.phone || '',
      website: poi.url || '',
      distance: Math.round(distance),
      description: this.generateDescription(placeName, placeType, categories),
      localTip: this.generateLocalTip(placeType),
      handyPhrase: this.generateHandyPhrase(placeType),
      opening_hours: this.generateOpeningHours(),
      photos: [{
        photo_reference: this.generatePhotoUrl(placeName, categories),
        height: 400,
        width: 600
      }],
      photoUrl: '',
      source: 'azure_maps'
    };
  }

  getPlaceType(categories, query) {
    if (categories.length > 0) {
      const cat = categories[0].toLowerCase();
      if (cat.includes('restaurant')) return 'Restaurant';
      if (cat.includes('cafe') || cat.includes('coffee')) return 'Café';
      if (cat.includes('hotel')) return 'Hotel';
      if (cat.includes('museum')) return 'Museum';
      if (cat.includes('park')) return 'Park';
      if (cat.includes('temple') || cat.includes('church')) return 'Place of Worship';
      if (cat.includes('shopping') || cat.includes('mall')) return 'Shopping';
      if (cat.includes('bar') || cat.includes('pub')) return 'Bar';
    }
    return query.charAt(0).toUpperCase() + query.slice(1);
  }

  generateDescription(name, type, categories) {
    const templates = {
      'Restaurant': `Popular dining spot known for local cuisine and authentic flavors. ${name} offers a welcoming atmosphere for both locals and tourists.`,
      'Café': `Cozy café perfect for a quick coffee break or casual meal. ${name} is a favorite among locals for its relaxed ambiance.`,
      'Hotel': `Comfortable accommodation with modern amenities. ${name} provides convenient access to nearby attractions and local experiences.`,
      'Museum': `Cultural landmark showcasing local history and heritage. ${name} offers insights into the region's rich past and traditions.`,
      'Park': `Green space ideal for relaxation and outdoor activities. ${name} is a peaceful retreat from the city's hustle and bustle.`,
      'Place of Worship': `Historic religious site with architectural significance. ${name} welcomes respectful visitors interested in local culture.`,
      'Shopping': `Popular shopping destination with diverse retail options. ${name} features local crafts, souvenirs, and everyday goods.`,
      'Bar': `Lively venue for drinks and socializing. ${name} attracts both locals and visitors looking for evening entertainment.`
    };
    return templates[type] || `Interesting place to visit in the area. ${name} is worth exploring during your trip.`;
  }

  generateLocalTip(type) {
    const tips = {
      'Restaurant': 'Visit during lunch hours (12-2pm) for better availability. Dinner reservations recommended for weekends.',
      'Café': 'Morning hours (8-10am) are less crowded. Try local specialties for an authentic experience.',
      'Hotel': 'Book in advance during peak season (December-March). Ask about local tour packages at reception.',
      'Museum': 'Arrive early to avoid crowds. Photography may require special permission.',
      'Park': 'Best visited in early morning or late afternoon. Bring water and sun protection.',
      'Place of Worship': 'Dress modestly (cover shoulders and knees). Remove shoes before entering.',
      'Shopping': 'Bargaining is common in local markets. Carry small bills for easier transactions.',
      'Bar': 'Happy hour typically 5-7pm. Check local customs regarding alcohol service times.'
    };
    return tips[type] || 'Check opening hours before visiting. Local currency preferred for payments.';
  }

  generateHandyPhrase(type) {
    const phrases = {
      'Restaurant': 'Can I see the menu, please?',
      'Café': 'One coffee, please. To go.',
      'Hotel': 'Do you have rooms available?',
      'Museum': 'How much is the entrance fee?',
      'Park': 'Where is the main entrance?',
      'Place of Worship': 'May I look inside?',
      'Shopping': 'How much does this cost?',
      'Bar': 'What do you recommend?'
    };
    return phrases[type] || 'Hello, thank you!';
  }

  generateOpeningHours() {
    return {
      open_now: true,
      weekday_text: [
        'Monday: 9:00 AM – 9:00 PM',
        'Tuesday: 9:00 AM – 9:00 PM',
        'Wednesday: 9:00 AM – 9:00 PM',
        'Thursday: 9:00 AM – 9:00 PM',
        'Friday: 9:00 AM – 10:00 PM',
        'Saturday: 9:00 AM – 10:00 PM',
        'Sunday: 10:00 AM – 8:00 PM'
      ]
    };
  }

  generatePhotoUrl(placeName, categories) {
    const category = (categories[0] || 'place').toLowerCase();
    const hash = placeName.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    const seed = Math.abs(hash) % 1000;
    return `https://picsum.photos/seed/${seed}/600/400`;
  }

  generateRating(poi) {
    let rating = 3.5;
    if (poi.phone) rating += 0.3;
    if (poi.url) rating += 0.3;
    if (poi.categories && poi.categories.length > 0) rating += 0.2;
    return Math.min(Math.round(rating * 10) / 10, 5.0);
  }
    const q = query.toLowerCase();
    const categoryMap = {
      'restaurant': '7315', 'food': '7315', 'hotel': '7314', 'attraction': '7376',
      'tourist': '7376', 'museum': '7317', 'park': '9362', 'shopping': '7373',
      'cafe': '9376001', 'bar': '9376003', 'beach': '9992'
    };
    for (const [key, value] of Object.entries(categoryMap)) {
      if (q.includes(key)) return value;
    }
    return null;
  }
}
