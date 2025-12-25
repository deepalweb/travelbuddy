import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System Prompt (Set once, reuse forever)
const SYSTEM_PROMPT = `You are a travel content assistant for TravelBuddy mobile app.

CORE PRINCIPLE: Google Places = FACTS. AI = CONTEXT + TIPS.

STRICT RULES:
- NEVER invent facts, prices, hours, or events
- Use ONLY provided data
- If data missing → "Information not available"
- Keep mobile-friendly (2-3 sentences max per field)
- Be helpful, not promotional

OUTPUT: JSON only, no markdown, no explanations.

SCHEMA:
{
  "shortDescription": "2-3 sentences about the place",
  "whyVisit": "Main reasons travelers come here",
  "bestTimeToVisit": "General timing advice (morning/evening/weekday)",
  "localTip": "One practical insider tip",
  "safetyNote": "General safety advice or 'Safe for all travelers'"
}`;

// Category-aware context
const CATEGORY_CONTEXT = {
  restaurant: "Focus: cuisine, ambiance, dining experience",
  cafe: "Focus: atmosphere, beverages, work-friendly aspects",
  bar: "Focus: drinks, atmosphere, social experience",
  tourist_attraction: "Focus: historical/cultural significance, visitor experience",
  park: "Focus: nature, relaxation, outdoor activities",
  museum: "Focus: exhibits, educational value, cultural importance",
  art_gallery: "Focus: art collections, exhibitions, cultural value",
  night_club: "Focus: atmosphere, entertainment, social experience",
  shopping_mall: "Focus: shopping variety, brands, facilities",
  store: "Focus: products, shopping experience, unique offerings",
  lodging: "Focus: accommodation quality, amenities, location",
  hotel: "Focus: accommodation quality, amenities, location",
  church: "Focus: architecture, historical significance, spiritual importance",
  mosque: "Focus: architecture, historical significance, spiritual importance",
  temple: "Focus: architecture, historical significance, spiritual importance",
  zoo: "Focus: wildlife, educational value, family experience",
  aquarium: "Focus: marine life, educational value, family experience",
  amusement_park: "Focus: rides, entertainment, family fun",
  stadium: "Focus: events, sports, entertainment capacity",
  library: "Focus: collections, study spaces, cultural resources",
  spa: "Focus: wellness, relaxation, treatments",
  gym: "Focus: fitness facilities, equipment, atmosphere",
  movie_theater: "Focus: viewing experience, comfort, technology",
  casino: "Focus: gaming, entertainment, atmosphere"
};

// Language instructions
const LANGUAGE_INSTRUCTIONS = {
  en: "Write in clear, simple English",
  es: "Escribe en español claro y simple",
  fr: "Écrivez en français clair et simple",
  de: "Schreiben Sie in klarem, einfachem Deutsch",
  it: "Scrivi in italiano chiaro e semplice",
  pt: "Escreva em português claro e simples",
  ja: "明確でシンプルな日本語で書いてください",
  ko: "명확하고 간단한 한국어로 작성하세요",
  zh: "用清晰简单的中文书写",
  ar: "اكتب بلغة عربية واضحة وبسيطة",
  hi: "स्पष्ट और सरल हिंदी में लिखें"
};

// Fallback content generator
function generateFallback(place) {
  const typeName = place.types?.[0]?.replace(/_/g, ' ') || 'location';
  return {
    shortDescription: `${place.name} is a ${typeName} in ${place.city || place.vicinity || 'the area'}.`,
    whyVisit: "Popular with travelers for its location and amenities.",
    bestTimeToVisit: "Visit during regular business hours.",
    localTip: "Check recent reviews for current conditions.",
    safetyNote: "Follow standard travel safety practices."
  };
}

// Create enrichment prompt
function createEnrichmentPrompt(place, language = 'en') {
  const primaryType = place.types?.[0] || 'point_of_interest';
  const context = CATEGORY_CONTEXT[primaryType] || 'General travel destination';
  const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;
  
  return `Place: ${place.name}
Category: ${primaryType}
Location: ${place.city || place.vicinity || 'Unknown'}, ${place.country || ''}
Rating: ${place.rating || 'N/A'}/5 (${place.user_ratings_total || 0} reviews)
Price: ${place.price_level ? '$'.repeat(place.price_level) : 'N/A'}

Context: ${context}
Language: ${langInstruction}

Generate enrichment JSON.`;
}

// Validate enrichment quality
function validateEnrichment(data) {
  if (!data || typeof data !== 'object') return false;
  
  const checks = [
    data.shortDescription?.length > 20 && data.shortDescription?.length < 300,
    data.whyVisit?.length > 10 && data.whyVisit?.length < 200,
    data.bestTimeToVisit?.length > 5 && data.bestTimeToVisit?.length < 150,
    data.localTip?.length > 10 && data.localTip?.length < 200,
    data.safetyNote?.length > 5 && data.safetyNote?.length < 150,
    !data.shortDescription?.toLowerCase().includes('opening hours'),
    !data.shortDescription?.toLowerCase().includes('$')
  ];
  
  return checks.filter(Boolean).length >= 5; // At least 5 checks must pass
}

// Metrics tracking
const enrichmentMetrics = {
  totalCalls: 0,
  totalTokens: 0,
  cacheHits: 0,
  failures: 0,
  avgTokensPerPlace: 0,
  estimatedCost: 0
};

// In-memory cache (use Redis in production)
const enrichmentCache = new Map();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function getCacheKey(placeId, language) {
  return `enrich_${placeId}_${language}_v2`;
}

function getCachedEnrichment(placeId, language) {
  const key = getCacheKey(placeId, language);
  const cached = enrichmentCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    enrichmentMetrics.cacheHits++;
    return cached.data;
  }
  
  return null;
}

function setCachedEnrichment(placeId, language, data) {
  const key = getCacheKey(placeId, language);
  enrichmentCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Single place enrichment
async function enrichPlace(place, language = 'en') {
  try {
    // Check cache first
    const cached = getCachedEnrichment(place.place_id, language);
    if (cached) {
      return { ...cached, cached: true };
    }

    enrichmentMetrics.totalCalls++;

    const userPrompt = createEnrichmentPrompt(place, language);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    const enriched = JSON.parse(content);

    // Track metrics
    enrichmentMetrics.totalTokens += completion.usage.total_tokens;
    enrichmentMetrics.avgTokensPerPlace = enrichmentMetrics.totalTokens / enrichmentMetrics.totalCalls;
    enrichmentMetrics.estimatedCost = (enrichmentMetrics.totalTokens / 1000) * 0.00015; // GPT-4o-mini pricing

    // Validate quality
    if (!validateEnrichment(enriched)) {
      console.warn(`Enrichment validation failed for ${place.place_id}, using fallback`);
      const fallback = generateFallback(place);
      setCachedEnrichment(place.place_id, language, fallback);
      return { ...fallback, cached: false, fallback: true };
    }

    // Cache successful enrichment
    setCachedEnrichment(place.place_id, language, enriched);

    return { ...enriched, cached: false };
  } catch (error) {
    console.error('Enrichment failed:', error.message);
    enrichmentMetrics.failures++;
    return { ...generateFallback(place), cached: false, fallback: true, error: error.message };
  }
}

// Batch enrichment (up to 10 places)
async function batchEnrich(places, language = 'en') {
  const results = [];
  
  for (const place of places) {
    const enriched = await enrichPlace(place, language);
    results.push({
      place_id: place.place_id,
      name: place.name,
      enrichment: enriched
    });
  }
  
  return results;
}

// POST /api/places-enrichment/enrich - Single place enrichment
router.post('/enrich', async (req, res) => {
  try {
    const { place, language = 'en' } = req.body;

    if (!place || !place.place_id || !place.name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: place.place_id and place.name'
      });
    }

    const enriched = await enrichPlace(place, language);

    res.json({
      success: true,
      data: {
        place_id: place.place_id,
        enrichment: enriched
      }
    });
  } catch (error) {
    console.error('Enrichment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/places-enrichment/batch - Batch enrichment (max 10 places)
router.post('/batch', async (req, res) => {
  try {
    const { places, language = 'en' } = req.body;

    if (!Array.isArray(places) || places.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'places must be a non-empty array'
      });
    }

    if (places.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 places per batch request'
      });
    }

    const results = await batchEnrich(places, language);

    res.json({
      success: true,
      data: results,
      metrics: {
        processed: results.length,
        cached: results.filter(r => r.enrichment.cached).length,
        fallback: results.filter(r => r.enrichment.fallback).length
      }
    });
  } catch (error) {
    console.error('Batch enrichment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/places-enrichment/metrics - Get enrichment metrics
router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: {
      ...enrichmentMetrics,
      cacheSize: enrichmentCache.size,
      cacheHitRate: enrichmentMetrics.totalCalls > 0 
        ? ((enrichmentMetrics.cacheHits / (enrichmentMetrics.totalCalls + enrichmentMetrics.cacheHits)) * 100).toFixed(2) + '%'
        : '0%',
      estimatedCostUSD: '$' + enrichmentMetrics.estimatedCost.toFixed(4)
    }
  });
});

// DELETE /api/places-enrichment/cache - Clear cache
router.delete('/cache', (req, res) => {
  const size = enrichmentCache.size;
  enrichmentCache.clear();
  
  res.json({
    success: true,
    message: `Cleared ${size} cached entries`
  });
});

export default router;
