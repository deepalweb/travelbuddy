export const destinationsByCountry = {
  GB: [
    {
      id: 1,
      name: 'London',
      tagline: 'Historic Capital',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop',
      rating: 4.8,
      season: 'May-Sep',
      budget: '£80-150/day'
    },
    {
      id: 2,
      name: 'Edinburgh',
      tagline: 'Scottish Heritage',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      rating: 4.7,
      season: 'Jun-Aug',
      budget: '£60-120/day'
    }
  ],
  US: [
    {
      id: 1,
      name: 'New York',
      tagline: 'The Big Apple',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop',
      rating: 4.9,
      season: 'Apr-Jun',
      budget: '$100-200/day'
    },
    {
      id: 2,
      name: 'San Francisco',
      tagline: 'Golden Gate City',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      rating: 4.6,
      season: 'Sep-Nov',
      budget: '$120-250/day'
    }
  ],
  LK: [
    {
      id: 1,
      name: 'Kandy',
      tagline: 'Cultural Heart of Sri Lanka',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
      rating: 4.7,
      season: 'Dec-Apr',
      budget: '$15-40/day'
    },
    {
      id: 2,
      name: 'Ella',
      tagline: 'Hill Country Paradise',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
      rating: 4.8,
      season: 'Dec-Mar',
      budget: '$12-30/day'
    }
  ]
}

export const searchSuggestionsByCountry = {
  GB: ['restaurants in London', 'attractions in Edinburgh', 'hotels in Bath', 'pubs in Manchester'],
  US: ['restaurants in NYC', 'attractions in LA', 'hotels in Miami', 'bars in Chicago'],
  LK: ['restaurants in Colombo', 'temples in Kandy', 'hotels in Galle', 'beaches in Mirissa']
}

export const culturalInfoByCountry = {
  GB: {
    language: 'English',
    currency: '1 GBP ≈ 1.27 USD',
    weather: '15°C, Mild Climate',
    emergency: '999 Police, Fire, Ambulance'
  },
  US: {
    language: 'English',
    currency: '1 USD ≈ 1.00 USD',
    weather: '20°C, Varied Climate',
    emergency: '911 Police, Fire, Ambulance'
  },
  LK: {
    language: 'Sinhala, Tamil, English',
    currency: '1 USD ≈ 320 LKR',
    weather: '28°C, Tropical Climate',
    emergency: '119 Police, 110 Fire'
  }
}
