import express from 'express';
const router = express.Router();

// Mock translation data - in production, integrate with Google Translate API
const TRAVEL_PHRASES = {
  'fr': {
    'emergency': [
      {
        id: 'help_fr',
        category: 'emergency',
        english: 'Help!',
        translation: 'Au secours!',
        pronunciation: 'oh suh-KOOR'
      },
      {
        id: 'police_fr',
        category: 'emergency',
        english: 'I need police',
        translation: 'J\'ai besoin de la police',
        pronunciation: 'zhay buh-ZWAN duh lah po-LEES'
      },
      {
        id: 'hospital_fr',
        category: 'emergency',
        english: 'I need a hospital',
        translation: 'J\'ai besoin d\'un hôpital',
        pronunciation: 'zhay buh-ZWAN dun oh-pee-TAHL'
      },
      {
        id: 'lost_fr',
        category: 'emergency',
        english: 'I am lost',
        translation: 'Je suis perdu(e)',
        pronunciation: 'zhuh swee per-DUH'
      }
    ],
    'greetings': [
      {
        id: 'hello_fr',
        category: 'greetings',
        english: 'Hello',
        translation: 'Bonjour',
        pronunciation: 'bon-ZHOOR'
      },
      {
        id: 'thank_you_fr',
        category: 'greetings',
        english: 'Thank you',
        translation: 'Merci',
        pronunciation: 'mer-SEE'
      },
      {
        id: 'excuse_me_fr',
        category: 'greetings',
        english: 'Excuse me',
        translation: 'Excusez-moi',
        pronunciation: 'ek-skew-zay MWAH'
      }
    ],
    'directions': [
      {
        id: 'where_is_fr',
        category: 'directions',
        english: 'Where is...?',
        translation: 'Où est...?',
        pronunciation: 'oo eh'
      },
      {
        id: 'left_fr',
        category: 'directions',
        english: 'Left',
        translation: 'Gauche',
        pronunciation: 'gohsh'
      },
      {
        id: 'right_fr',
        category: 'directions',
        english: 'Right',
        translation: 'Droite',
        pronunciation: 'drwaht'
      }
    ]
  },
  'de': {
    'emergency': [
      {
        id: 'help_de',
        category: 'emergency',
        english: 'Help!',
        translation: 'Hilfe!',
        pronunciation: 'HIL-fuh'
      },
      {
        id: 'police_de',
        category: 'emergency',
        english: 'I need police',
        translation: 'Ich brauche die Polizei',
        pronunciation: 'ikh BROW-khuh dee po-li-TSIGH'
      }
    ],
    'greetings': [
      {
        id: 'hello_de',
        category: 'greetings',
        english: 'Hello',
        translation: 'Hallo',
        pronunciation: 'HAH-loh'
      },
      {
        id: 'thank_you_de',
        category: 'greetings',
        english: 'Thank you',
        translation: 'Danke',
        pronunciation: 'DAHN-kuh'
      }
    ]
  },
  'ja': {
    'emergency': [
      {
        id: 'help_ja',
        category: 'emergency',
        english: 'Help!',
        translation: '助けて！',
        pronunciation: 'ta-su-ke-te'
      },
      {
        id: 'police_ja',
        category: 'emergency',
        english: 'I need police',
        translation: '警察が必要です',
        pronunciation: 'kei-sa-tsu ga hi-tsu-you de-su'
      }
    ],
    'greetings': [
      {
        id: 'hello_ja',
        category: 'greetings',
        english: 'Hello',
        translation: 'こんにちは',
        pronunciation: 'kon-ni-chi-wa'
      },
      {
        id: 'thank_you_ja',
        category: 'greetings',
        english: 'Thank you',
        translation: 'ありがとうございます',
        pronunciation: 'a-ri-ga-tou go-za-i-ma-su'
      }
    ]
  }
};

// Country to language mapping
const COUNTRY_LANGUAGES = {
  'FR': { primary: 'fr', common: ['fr', 'en'] },
  'DE': { primary: 'de', common: ['de', 'en'] },
  'ES': { primary: 'es', common: ['es', 'en'] },
  'IT': { primary: 'it', common: ['it', 'en'] },
  'JP': { primary: 'ja', common: ['ja', 'en'] },
  'KR': { primary: 'ko', common: ['ko', 'en'] },
  'CN': { primary: 'zh', common: ['zh', 'en'] },
  'RU': { primary: 'ru', common: ['ru', 'en'] },
  'PT': { primary: 'pt', common: ['pt', 'en'] },
  'SA': { primary: 'ar', common: ['ar', 'en'] }
};

// POST /api/translation/translate - Translate text
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    // In production, integrate with Google Translate API
    // For now, return mock translation
    const mockTranslation = `[${targetLanguage.toUpperCase()}] ${text}`;
    
    res.json({
      translation: mockTranslation,
      sourceLanguage,
      targetLanguage,
      confidence: 0.95
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// GET /api/translation/travel-phrases/:language - Get travel phrases
router.get('/travel-phrases/:language', (req, res) => {
  try {
    const { language } = req.params;
    const { category } = req.query;

    const languagePhrases = TRAVEL_PHRASES[language];
    if (!languagePhrases) {
      return res.status(404).json({ error: 'Language not supported' });
    }

    let phrases = [];
    if (category && languagePhrases[category]) {
      phrases = languagePhrases[category];
    } else {
      // Return all phrases for the language
      phrases = Object.values(languagePhrases).flat();
    }

    res.json({
      language,
      category: category || 'all',
      phrases
    });
  } catch (error) {
    console.error('Error fetching travel phrases:', error);
    res.status(500).json({ error: 'Failed to fetch travel phrases' });
  }
});

// GET /api/translation/location-language - Get language info for location
router.get('/location-language', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Mock reverse geocoding - in production, use Google Maps Geocoding API
    // For demo, return French for coordinates near France
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    let countryCode = 'US';
    let countryName = 'United States';
    
    // Simple coordinate-based country detection (mock)
    if (latitude >= 42 && latitude <= 51 && longitude >= -5 && longitude <= 8) {
      countryCode = 'FR';
      countryName = 'France';
    } else if (latitude >= 47 && latitude <= 55 && longitude >= 5 && longitude <= 15) {
      countryCode = 'DE';
      countryName = 'Germany';
    } else if (latitude >= 35 && latitude <= 44 && longitude >= 130 && longitude <= 146) {
      countryCode = 'JP';
      countryName = 'Japan';
    }

    const languageInfo = COUNTRY_LANGUAGES[countryCode] || { primary: 'en', common: ['en'] };
    const emergencyPhrases = TRAVEL_PHRASES[languageInfo.primary]?.emergency || [];

    res.json({
      countryCode,
      countryName,
      primaryLanguage: languageInfo.primary,
      commonLanguages: languageInfo.common,
      emergencyPhrases
    });
  } catch (error) {
    console.error('Error getting location language info:', error);
    res.status(500).json({ error: 'Failed to get location language info' });
  }
});

export default router;