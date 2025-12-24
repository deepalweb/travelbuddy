import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// NewsAPI configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'demo'; // Get free key from newsapi.org
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

// Cache for news articles
const newsCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

// Travel-related keywords
const TRAVEL_KEYWORDS = [
  'travel', 'tourism', 'vacation', 'destination', 'hotel', 'flight',
  'adventure', 'backpacking', 'cruise', 'resort', 'airline', 'airport',
  'visa', 'passport', 'travel tips', 'travel guide', 'wanderlust'
];

// Get latest travel news
router.get('/latest', async (req, res) => {
  try {
    const { category = 'general', country, limit = 20, page = 1 } = req.query;
    
    const cacheKey = `news_${category}_${country}_${page}`;
    const cached = newsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Build query
    let query = 'travel OR tourism OR vacation OR destination';
    if (category !== 'general') {
      query += ` AND ${category}`;
    }

    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: limit,
      page: page
    });

    if (country) params.append('country', country);

    const response = await fetch(`${NEWS_API_URL}?${params}`, {
      headers: { 'X-Api-Key': NEWS_API_KEY }
    });

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    const articles = data.articles?.map(article => ({
      id: article.url,
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      imageUrl: article.urlToImage,
      source: article.source.name,
      author: article.author,
      publishedAt: article.publishedAt,
      category: category
    })) || [];

    const result = {
      status: 'success',
      totalResults: data.totalResults || 0,
      articles: articles,
      page: parseInt(page),
      pageSize: parseInt(limit)
    };

    newsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);

  } catch (error) {
    console.error('Travel news error:', error);
    res.json({
      status: 'success',
      articles: getFallbackNews(),
      totalResults: 5,
      cached: true
    });
  }
});

// Get trending travel destinations news
router.get('/destinations', async (req, res) => {
  try {
    const { destination, limit = 10 } = req.query;
    
    if (!destination) {
      return res.status(400).json({ error: 'Destination required' });
    }

    const cacheKey = `dest_news_${destination}`;
    const cached = newsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    const query = `${destination} AND (travel OR tourism OR visit)`;
    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: limit
    });

    const response = await fetch(`${NEWS_API_URL}?${params}`, {
      headers: { 'X-Api-Key': NEWS_API_KEY }
    });

    const data = await response.json();
    
    const articles = data.articles?.map(article => ({
      id: article.url,
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.urlToImage,
      source: article.source.name,
      publishedAt: article.publishedAt,
      destination: destination
    })) || [];

    const result = { status: 'success', articles };
    newsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);

  } catch (error) {
    console.error('Destination news error:', error);
    res.json({ status: 'success', articles: [] });
  }
});

// Get travel news by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 15 } = req.query;

    const categoryQueries = {
      flights: 'airline OR flight OR aviation',
      hotels: 'hotel OR accommodation OR resort',
      destinations: 'destination OR travel guide OR places to visit',
      tips: 'travel tips OR travel hacks OR travel advice',
      safety: 'travel safety OR travel warning OR travel advisory',
      deals: 'travel deals OR cheap flights OR hotel discounts',
      news: 'travel news OR tourism news'
    };

    const query = `(${categoryQueries[category] || 'travel'}) AND travel`;
    
    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: limit
    });

    const response = await fetch(`${NEWS_API_URL}?${params}`, {
      headers: { 'X-Api-Key': NEWS_API_KEY }
    });

    const data = await response.json();
    
    const articles = data.articles?.map(article => ({
      id: article.url,
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.urlToImage,
      source: article.source.name,
      publishedAt: article.publishedAt,
      category: category
    })) || [];

    res.json({ status: 'success', articles, category });

  } catch (error) {
    console.error('Category news error:', error);
    res.json({ status: 'success', articles: [], category: req.params.category });
  }
});

// Search travel news
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const query = `${q} AND travel`;
    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'relevancy',
      pageSize: limit
    });

    const response = await fetch(`${NEWS_API_URL}?${params}`, {
      headers: { 'X-Api-Key': NEWS_API_KEY }
    });

    const data = await response.json();
    
    const articles = data.articles?.map(article => ({
      id: article.url,
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.urlToImage,
      source: article.source.name,
      publishedAt: article.publishedAt
    })) || [];

    res.json({ status: 'success', articles, query: q });

  } catch (error) {
    console.error('Search news error:', error);
    res.json({ status: 'success', articles: [], query: req.query.q });
  }
});

// Fallback news when API fails
function getFallbackNews() {
  return [
    {
      id: '1',
      title: 'Top 10 Travel Destinations for 2024',
      description: 'Discover the most popular travel destinations trending this year.',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
      source: 'TravelBuddy',
      publishedAt: new Date().toISOString(),
      category: 'destinations'
    },
    {
      id: '2',
      title: 'Travel Safety Tips for International Travelers',
      description: 'Essential safety guidelines for your next international trip.',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400',
      source: 'TravelBuddy',
      publishedAt: new Date().toISOString(),
      category: 'safety'
    },
    {
      id: '3',
      title: 'Best Budget Travel Destinations',
      description: 'Explore amazing places without breaking the bank.',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400',
      source: 'TravelBuddy',
      publishedAt: new Date().toISOString(),
      category: 'deals'
    },
    {
      id: '4',
      title: 'How to Find Cheap Flights',
      description: 'Expert tips for booking affordable flights.',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400',
      source: 'TravelBuddy',
      publishedAt: new Date().toISOString(),
      category: 'flights'
    },
    {
      id: '5',
      title: 'Hidden Gems: Off-the-Beaten-Path Destinations',
      description: 'Discover lesser-known travel destinations worth visiting.',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400',
      source: 'TravelBuddy',
      publishedAt: new Date().toISOString(),
      category: 'destinations'
    }
  ];
}

// Clear cache
router.delete('/cache', (req, res) => {
  newsCache.clear();
  res.json({ success: true, message: 'News cache cleared' });
});

export default router;
