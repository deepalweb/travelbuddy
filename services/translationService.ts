import { apiService } from './apiService';

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TravelPhrase {
  id: string;
  category: string;
  english: string;
  translation: string;
  pronunciation?: string;
  audioUrl?: string;
}

export interface LocationLanguageInfo {
  countryCode: string;
  primaryLanguage: string;
  commonLanguages: string[];
  emergencyPhrases: TravelPhrase[];
}

class TranslationService {
  private cache = new Map<string, string>();
  private phraseCache = new Map<string, TravelPhrase[]>();

  // Real-time translation using backend API
  async translateText(request: TranslationRequest): Promise<string> {
    const cacheKey = `${request.text}_${request.targetLanguage}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await apiService.post('/api/translate', request);
      const translation = response.data.translation;
      
      this.cache.set(cacheKey, translation);
      return translation;
    } catch (error) {
      console.error('Translation failed:', error);
      return request.text; // Return original text if translation fails
    }
  }

  // Get travel phrases for a specific language and category
  async getTravelPhrases(language: string, category?: string): Promise<TravelPhrase[]> {
    const cacheKey = `${language}_${category || 'all'}`;
    
    if (this.phraseCache.has(cacheKey)) {
      return this.phraseCache.get(cacheKey)!;
    }

    try {
      const response = await apiService.get(`/api/travel-phrases/${language}`, {
        params: { category }
      });
      
      const phrases = response.data.phrases;
      this.phraseCache.set(cacheKey, phrases);
      return phrases;
    } catch (error) {
      console.error('Failed to fetch travel phrases:', error);
      return this.getOfflinePhrases(language, category);
    }
  }

  // Get language suggestions based on location
  async getLocationLanguageInfo(latitude: number, longitude: number): Promise<LocationLanguageInfo | null> {
    try {
      const response = await apiService.get('/api/location-language', {
        params: { lat: latitude, lng: longitude }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get location language info:', error);
      return null;
    }
  }

  // Offline emergency phrases (fallback)
  private getOfflinePhrases(language: string, category?: string): TravelPhrase[] {
    const emergencyPhrases: Record<string, TravelPhrase[]> = {
      'fr': [
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
        }
      ],
      'de': [
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
      'ja': [
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
      ]
    };

    return emergencyPhrases[language] || [];
  }

  // Translate place information
  async translatePlaceInfo(placeData: any, targetLanguage: string): Promise<any> {
    if (!placeData || targetLanguage === 'en') return placeData;

    try {
      const translatedData = { ...placeData };
      
      if (placeData.name) {
        translatedData.translatedName = await this.translateText({
          text: placeData.name,
          targetLanguage
        });
      }
      
      if (placeData.editorial_summary) {
        translatedData.translatedSummary = await this.translateText({
          text: placeData.editorial_summary,
          targetLanguage
        });
      }

      return translatedData;
    } catch (error) {
      console.error('Failed to translate place info:', error);
      return placeData;
    }
  }

  // Clear translation cache
  clearCache(): void {
    this.cache.clear();
    this.phraseCache.clear();
  }
}

export const translationService = new TranslationService();