import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Place, TripPlanSuggestion, PlaceSummary, SurpriseSuggestion, TripPace, TravelStyle, BudgetLevel, HospitalInfo, UserInterest, SuggestedEmergencyNumbers, EmbassyInfo, CommunityPhoto, CommunityPhotoUploadData, ItinerarySuggestion, QuickTourPlan, SupportPoint, LocalInfo, LocalAgencyPlan } from '../types.ts';
import { GEMINI_MODEL_TEXT, LOCAL_STORAGE_COMMUNITY_PHOTOS_KEY } from '../constants.ts';

// import { websocketService } from './websocketService';
import { usageAnalytics } from './usageAnalyticsService.ts';
import { apiLimiter } from './apiLimiter.ts';

// Add this at the top of the file or in a global .d.ts file if preferred
declare global {
  interface ImportMetaEnv {
    VITE_GEMINI_API_KEY: string;
  }
  // interface ImportMeta { env: ImportMetaEnv }
}

const apiKey: string = import.meta.env.VITE_GEMINI_API_KEY as string || "";

if (!apiKey) {
  console.error("Gemini API key is not configured. Please set the VITE_GEMINI_API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey });

// Enhanced AI capabilities
export const recognizeLandmark = async (imageDataUrl: string): Promise<{name: string, description: string, confidence: number}> => {
  try {
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: [{
        parts: [
          { text: "Identify this landmark and provide: name, brief description, and confidence level (0-1). Return as JSON." },
          { inlineData: { mimeType: "image/jpeg", data: imageDataUrl.split(',')[1] } }
        ]
      }],
      config: { responseMimeType: 'application/json' }
    });
    
    return processResponse(response, 'landmarkRecognition');
  } catch (error) {
    console.error('Landmark recognition failed:', error);
    throw new Error('Could not identify landmark');
  }
};

export const generatePersonalizedRecommendations = async (userHistory: any[], currentLocation: {lat: number, lng: number}): Promise<any[]> => {
  try {
    const prompt = `Based on user's travel history: ${JSON.stringify(userHistory)} and current location: ${currentLocation.lat}, ${currentLocation.lng}, suggest 5 personalized places. Return as JSON array.`;
    
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return processResponse(response, 'personalizedRecommendations');
  } catch (error) {
    console.error('Personalized recommendations failed:', error);
    return [];
  }
};

export const optimizeBudget = async (itinerary: any, budget: number, currency: string): Promise<any> => {
  try {
    const prompt = `Optimize this itinerary: ${JSON.stringify(itinerary)} for budget: ${budget} ${currency}. Suggest cost-effective alternatives and return optimized plan as JSON.`;
    
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return processResponse(response, 'budgetOptimization');
  } catch (error) {
    console.error('Budget optimization failed:', error);
    throw new Error('Could not optimize budget');
  }
};

const generateContentWithRetry = async (
  params: Parameters<typeof ai.models.generateContent>[0],
  retries = 5,
  delay = 10000
): Promise<GenerateContentResponse> => {
  return await apiLimiter.limitedRequest('gemini', params, async () => {
    try {
  const start = Date.now();
  const resp = await ai.models.generateContent(params);
  usageAnalytics.postUsage({ api: 'gemini', action: 'generateContent', status: 'success', durationMs: Date.now() - start });
  return resp;
    } catch (error: any) {
  usageAnalytics.postUsage({ api: 'gemini', action: 'generateContent', status: 'error', meta: { err: error?.message || String(error) } });
      if (retries > 0) {
        // Check for 429 Rate Limit errors - these are handled by apiLimiter, so we don't retry them here
        const isRateLimitError = (
          (error.toString().includes('429')) ||
          (error.error && error.error.code === 429) ||
          (error.message && error.message.toLowerCase().includes("resource_exhausted")) ||
          (error.message && error.message.toLowerCase().includes("quota"))
        );

        // Only retry for non-rate-limit errors (5xx Server errors or network-related RPC failures)
        const isServerError = (
          (error.toString().includes('500')) ||
          (error.toString().includes('503')) ||
          (error.error && error.error.code >= 500 && error.error.code < 600) ||
          (error.message && error.message.toLowerCase().includes("internal error")) ||
          (error.message && error.message.toLowerCase().includes("rpc failed")) ||
          (error.message && error.message.toLowerCase().includes("overloaded"))
        );
        
        if (isServerError && !isRateLimitError) {
          // Enhanced exponential backoff with jitter
          const baseDelay = delay * Math.pow(2, 5 - retries); // Exponential backoff
          const jitter = Math.floor(Math.random() * (baseDelay * 0.3)); // 30% jitter
          const waitTime = Math.min(baseDelay + jitter, 60000); // Cap at 60s
          
          console.warn(`[Gemini API] Server error encountered. Retrying in ${(waitTime / 1000).toFixed(1)}s... (${retries} retries left)`);
          
          await new Promise(res => setTimeout(res, waitTime));
          return generateContentWithRetry(params, retries - 1, delay);
        }
      }
      
      // If it's a rate limit error, let the apiLimiter handle it through queuing
      // If not a retryable error or no retries left, re-throw the original error
      throw error;
    }
  });
};

export { generateContentWithRetry };


// --- BATCHED ENRICHMENT PROMPT ---
export const enrichMultiplePlaceDetailsPrompt = (placeFacts: Partial<Place>[]): string => {
  const factSheet = placeFacts.map(p => `
- ID: ${p.place_id}
- Name: ${p.name}
- Address: ${p.formatted_address}
- Types: ${p.types?.join(', ')}
`).join('\n');

  return `
You are a creative travel content writer AI. You will be given an array of factual data about several places. You must enrich each one with creative content.
Factual Data Array:
${factSheet}

Your task is to generate a JSON array. Each object in the array must correspond to a place from the input and contain ONLY the following creative fields:
- "id": The original ID of the place (e.g., "${placeFacts[0]?.place_id}"). This MUST match the input ID.
- "type": A single, user-friendly category for this place (e.g., "Landmark", "Cafe").
- "description": A concise, engaging, and realistic description (2-3 sentences).
- "localTip": A realistic and useful local tip.
- "handyPhrase": A realistic and simple common English phrase a tourist might use there.
- "deal": (Optional, can be null) A plausible deal object with 'id', 'title', 'description', and 'discount'.
- "examplePrice": (Optional, can be null) A plausible price object with 'description', 'amount', and 'currencyCode'.

The output array must have the exact same number of objects as the input facts, and the 'id' field must be used to match them.

Example response for two places:
[
  {
    "id": "${placeFacts[0]?.place_id || 'mock-id-0'}",
    "type": "Market",
    "description": "A vibrant marketplace featuring local artisan foods and restaurants.",
    "localTip": "Visit on a Saturday for the largest farmers market.",
    "handyPhrase": "Which vendor sells the best cheese?",
    "deal": null,
    "examplePrice": { "description": "Artisan Coffee", "amount": 5.50, "currencyCode": "USD" }
  },
  {
    "id": "${placeFacts[1]?.place_id || 'mock-id-1'}",
    "type": "Park",
    "description": "A beautiful urban park perfect for a relaxing afternoon stroll.",
    "localTip": "The west side of the park has the best sunset views.",
    "handyPhrase": "Is this path leading to the lake?",
    "deal": null,
    "examplePrice": null
  }
]

IMPORTANT: The entire response MUST be a single, valid JSON array. Do not include any text, explanations, or conversational text. Strictly adhere to JSON formatting.
`;
};


const generateItineraryPrompt = (places: Place[]): string => {
  const placeDetails = places.map(p => `- ${p.name} (Type: ${p.type}, Address: ${p.address}, Rating: ${p.rating}, Description: ${p.description}, Local Tip: ${p.localTip}) - Place ID: ${p.id}`).join('\n');
  return `
You are an expert travel planner. Create a compelling and realistic 1-day itinerary based on the following selected places:
${placeDetails}

The itinerary should be for a single day.
Structure the response as a JSON object with the following fields: "title", "introduction", "dailyPlan", and "conclusion".
"dailyPlan" should be an array containing a single object (for Day 1).
This Day 1 object should have:
  - "day": 1 (This should always be 1 for a 1-day itinerary).
  - "theme": A short, catchy theme for the day (e.g., "Historic Charm & Culinary Delights").
  - "activities": An array of activity objects. Each activity object must include:
    - "placeName": The name of the place. (Optional, can use placeId if name is redundant with activityTitle)
    - "placeId": The Place ID of the place from the input list. THIS IS CRUCIAL.
    - "activityDescription": A brief description of what to do at this place.
    - "estimatedTime": Suggested time (e.g., "9:00 AM - 11:00 AM", "2 hours").
    - "notes": Optional brief notes or tips for this activity (e.g., "Book tickets online", "Try the croissants").

The "title" should be engaging.
The "introduction" should set the stage for the day.
The "conclusion" should wrap up the day's plan.
Ensure the activities are logically sequenced.
Consider travel time implicitly by suggesting reasonable time slots.
Example of the "dailyPlan" array structure:
"dailyPlan": [
  {
    "day": 1,
    "theme": "Exploration Day in the City",
    "activities": [
      {
        "placeName": "Museum of Modern Art",
        "placeId": "place-museum-id",
        "activityDescription": "Explore contemporary art exhibits.",
        "estimatedTime": "10:00 AM - 1:00 PM",
        "notes": "Check for special exhibitions."
      },
      {
        "placeName": "Central Park Cafe",
        "placeId": "place-cafe-id",
        "activityDescription": "Enjoy a relaxing lunch by the park.",
        "estimatedTime": "1:30 PM - 2:30 PM"
      }
    ]
  }
]
Focus on creating a practical and enjoyable 1-day plan using ONLY the provided places. The placeId for each activity MUST correspond to one of the Place IDs provided in the input.
Make the itinerary sound exciting and well-thought-out.
Only include a single day in "dailyPlan" as this is for a 1-day itinerary.
The "id" for the itinerary itself will be added later, do not include "id" in the JSON you generate for the root object.

IMPORTANT: The entire response MUST be a single, valid JSON object. Do not include any text, explanations, or conversational text before or after the JSON.
Strictly adhere to JSON formatting rules, like using double quotes for keys and strings, and avoiding trailing commas. Ensure all brackets and braces are correctly paired.
`;
};

const generateComprehensiveTripPlanPrompt = (
  destination: string,
  duration: string,
  interests?: string,
  pace?: TripPace,
  travelStyles?: TravelStyle[],
  budget?: BudgetLevel
): string => {
  let prompt = `
You are an expert travel planner AI. Create a comprehensive, visually rich, and engaging multi-day trip plan.
Destination: ${destination}
Duration: ${duration}
`;
  if (interests) prompt += `\nInterests: ${interests}`;
  if (pace) prompt += `\nPace: ${pace}`;
  if (travelStyles && travelStyles.length > 0) prompt += `\nTravel Styles: ${travelStyles.join(', ')}`;
  if (budget) prompt += `\nBudget Level: ${budget}`;

  prompt += `
Please structure the response as a single, valid JSON object. The root object should have the following fields:
- "tripTitle": An exciting title for the trip (e.g., "An Adventurous Week in ${destination}").
- "destination": The destination city/region.
- "duration": The duration of the trip.
- "introduction": A captivating introduction to the trip (2-3 sentences).
- "dailyPlans": An array of objects, one for each day. Each daily plan object MUST include:
  - "day": The day number (e.g., 1, 2, 3).
  - "title": A short, descriptive title for the day (e.g., "Arrival and City Exploration").
  - "theme": (Optional) A theme for the day (e.g., "Cultural Immersion").
  - "photoUrl": A URL for a representative image. If unavailable, leave empty and the app will show a placeholder. Do not use external stock image URLs.
  - "activities": An array of activity objects. Each activity object MUST include:
    - "timeOfDay": Suggested time (e.g., "Morning", "Afternoon", "Evening").
    - "activityTitle": A concise title for the activity (e.g., "Visit the Grand Palace").
    - "description": A detailed description of the activity (2-4 sentences).
    - "effortLevel": A string rating of the physical effort required. MUST be one of: 'Easy', 'Moderate', 'Tough'.
    - "category": A single, relevant category string. MUST be one of: 'Food', 'Sightseeing', 'Shopping', 'Transport', 'Accommodation', 'Nature', 'Activity'.
    - "icon": A single, relevant emoji string that represents the category (e.g., '🍽️' for Food, '🏛️' for Sightseeing, '🛍️' for Shopping, '🚆' for Transport, '🏨' for Accommodation, '🌳' for Nature, '🎟️' for Activity).
    - "estimatedDuration": (Optional) Estimated time for the activity (e.g., "2-3 hours").
    - "location": (Optional, but highly recommended) A specific, queryable location or address for mapping.
    - "bookingLink": (Optional) A placeholder booking link (use "https://example.com/mock-booking-link").
    - "notes": (Optional) Any important notes or tips for the activity.
  - "mealSuggestions": (Optional) An object with suggestions for "breakfast", "lunch", and "dinner".
- "sustainabilityTips": An array of 2-3 strings with tips for traveling responsibly in this destination.
- "culturalEtiquette": An array of 2-3 strings with important local customs to be aware of.
- "usefulPhrases": (Optional) An array of 3-5 useful local phrases as objects with "phrase" and "translation" fields.
- "accommodationSuggestions": (Optional) An array of strings with general accommodation suggestions.
- "transportationTips": (Optional) An array of strings with tips for getting around.
- "budgetConsiderations": (Optional) A brief paragraph on budget considerations.
- "packingTips": (Optional) An array of strings with relevant packing tips.
- "conclusion": A concluding paragraph to wrap up the trip plan.

Important Guidelines:
- Ensure activities are realistic and logically sequenced.
- The "photoUrl" field is optional. If unsure, leave it empty.
- The "effortLevel", "category", and "icon" for each activity are mandatory.
- The "location" should be as specific as possible to allow for map queries.

IMPORTANT: The entire response MUST be a single, valid JSON object. Do not include any text, explanations, or conversational text before or after the JSON.
Strictly adhere to JSON formatting rules (double quotes for keys and strings, no trailing commas).
`;
  return prompt;
};

const generateLocalAgencyPlanPrompt = (
  location: string,
  planType: string,
  interests: string
): string => {
  return `
You are an elite, hyper-local travel agent AI for the "Travel Buddy" app. You don't just list places; you craft immersive, narrative-driven experiences. Your tone is knowledgeable, friendly, and passionate about your city.

A user wants a bespoke travel plan for the following:
- Location: ${location}
- Type of Plan: ${planType}
- Specific Interests: ${interests || "None specified, focus on the plan type."}

Your task is to generate a single, valid JSON object that represents this bespoke plan. The JSON object must have the following structure:

{
  "planTitle": "An engaging and creative title for the plan.",
  "introduction": "A welcoming, narrative-style paragraph from you, the 'local agent', setting the scene for the day's adventure.",
  "schedule": [
    {
      "time": "A specific time, e.g., '9:00 AM' or 'Afternoon'",
      "title": "A short, catchy title for this activity.",
      "description": "A detailed, engaging description of the place and the experience. What makes it special? What should the user look out for? (3-4 sentences)",
      "insiderTip": "A genuinely useful and unique 'insider' tip. Something not everyone would know. (e.g., 'Ask the barista for the off-menu single-origin brew.', 'The back alley has the best photo spot.')",
      "address": "The REAL, full street address of the location.",
      "placeNameForMap": "The REAL, queryable name of the place for a mapping API (e.g., 'Tsujiri Tea House, Gion Main Branch')."
    }
  ],
  "localEtiquette": "A brief, helpful paragraph on local customs or etiquette relevant to the plan (e.g., tipping, public transport rules, how to order at a ramen shop).",
  "transportationAdvice": "Clear advice on how to get around for this specific plan (e.g., 'This itinerary is easily walkable.', 'You'll need a day pass for the metro's Hibiya line.').",
  "conclusion": "A friendly sign-off to conclude the plan, wishing the traveler a great time."
}

RULES:
- The number of activities in the 'schedule' should be appropriate for the plan type (e.g., 2-3 for a half-day, 4-6 for a full day).
- All place names and addresses MUST be REAL and located in the specified 'Location'.
- The entire response MUST be a single, valid JSON object. Do not include markdown, explanations, or any text outside the JSON structure.
- Adhere strictly to the JSON format, using double quotes for all keys and string values.
`;
};

const generateSurpriseSuggestionPrompt = (): string => {
  return `
You are a creative travel assistant. Generate a single, unique, and exciting "surprise" travel suggestion.
This could be a lesser-known destination, a unique activity, a quirky festival, or a themed travel idea.
Please provide the response as a JSON object with the following fields:
- "title": An intriguing title for the surprise suggestion (e.g., "Discover the Bioluminescent Beaches of Vaadhoo Island", "Attend the Monkey Buffet Festival in Thailand").
- "description": A compelling description of the surprise (3-5 sentences), explaining what it is and why it's special.
- "photoUrl": Optional representative image URL. If unavailable, leave empty.
- "funFact": (Optional) A fun or interesting fact related to the suggestion.
- "category": A category for the suggestion (e.g., "Unique Destination", "Cultural Experience", "Adventure Travel", "Quirky Festival", "Nature Escape").

Make the suggestion sound genuinely surprising and appealing.
Example:
{
  "title": "Sleep in a Salt Hotel in Bolivia",
  "description": "Imagine a hotel where everything – walls, furniture, even beds – is made entirely of salt! Spend a night at Palacio de Sal on the edge of the Salar de Uyuni salt flats. It's a surreal experience under starlit skies.",
  "photoUrl": "",
  "funFact": "The Salar de Uyuni is the world's largest salt flat and transforms into a giant mirror during the rainy season.",
  "category": "Unique Accommodation"
}
Provide only one such JSON object.
IMPORTANT: The entire response MUST be a single, valid JSON object. Do not include any text, explanations, or conversational text before or after the JSON.
Strictly adhere to JSON formatting rules, like using double quotes for keys and strings, and avoiding trailing commas.
`;
};

const askQuestionAboutPlacePrompt = (place: Place, question: string): string => {
  // Basic context from the place object
  const placeContext = `
    Name: ${place.name}
    Type: ${place.type}
    Address: ${place.formatted_address || place.address}
    Description: ${place.description}
    Rating: ${place.rating}
    ${place.localTip ? `Local Tip: ${place.localTip}` : ''}
    ${place.opening_hours?.weekday_text ? `Opening Hours: ${place.opening_hours.weekday_text.join(', ')}` : ''}
    ${place.website ? `Website: ${place.website}` : ''}
  `;

  return `
You are a helpful assistant for the Travel Buddy app.
A user is looking at details for a place and has a question.
Place Information:
${placeContext}

User's Question: "${question}"

Please provide a concise and helpful answer to the user's question based *only* on the provided Place Information and your general knowledge related to such places.
If the information isn't available in the provided context and isn't general knowledge you can infer, state that you don't have that specific detail.
Do not make up information. Keep the answer friendly and brief (1-3 sentences).
Do not refer to yourself as an AI or Large Language Model. Respond as if you are the Travel Buddy app's assistant.
`;
};

const fetchPlaceRecommendationsPrompt = (place: Place): string => {
  return `
You are a travel recommendation engine for the Travel Buddy app.
A user is currently viewing details for the following place:
  - Name: ${place.name}
  - Type: ${place.types ? place.types.join(', ') : place.type}
  - Location: ${place.formatted_address || place.address}
  - Description: ${place.description}

Based on this place, suggest 3 other REAL places that a user interested in "${place.name}" might also like. These recommendations should ideally be somewhat nearby or thematically similar.
Provide the response as a JSON array of 3 place summary objects. Each object must have ONLY the following fields:
- "id": A unique ID for the recommended place (e.g., "rec-place-xxxx"). It MUST be different from the input place's ID ("${place.id}"). Use real Google Place IDs if known and appropriate, otherwise generate a unique string.
- "name": The REAL name of the recommended place.
- "type": The primary REAL type of the recommended place (e.g., "Museum", "Restaurant", "Park").
- "photoUrl": Optional URL for a representative photo of the recommended place. Leave empty if unknown.
- "short_description": A very brief (1-2 sentences) REALISTIC summary explaining why this place is recommended or what it offers.

ABSOLUTELY DO NOT include any fields or data not explicitly defined above. Only include 'id', 'name', 'type', 'photoUrl', and 'short_description' for each of the 3 place summary objects. No other information, text, statistics, or any other data should be added to the objects or the array.

Example of one recommendation object:
{
  "id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "name": "Sydney Opera House",
  "type": "Performing Arts Theatre",
  "photoUrl": "",
  "short_description": "Iconic venue for world-class performances with stunning harbor views. A must-see architectural marvel."
}

Ensure the recommendations are distinct from the original place ("${place.name}").
Focus on providing relevant and appealing suggestions. The "id" for each recommendation MUST be unique and different from the input place's id.

IMPORTANT: The entire response MUST be a single, valid JSON array. Do not include any text, explanations, or conversational text before or after the JSON.
Strictly adhere to JSON formatting rules, like using double quotes for keys and strings, and avoiding trailing commas. Ensure all brackets and braces are correctly paired.
`;
};

const fetchNearbyHospitalsPrompt = (latitude: number, longitude: number): string => {
  return `
You are a helpful assistant providing emergency-related information.
A user needs to find nearby hospitals (or medical clinics if hospitals are not prevalent) around latitude ${latitude.toFixed(4)} and longitude ${longitude.toFixed(4)}.
Please provide a JSON array of up to 3 REAL hospitals or medical facilities in that vicinity.
Focus on facilities within an approximate 10-kilometer (or 6-mile) radius of these coordinates.
Each object in the array should have the following fields:
- "name": The REAL name of the hospital or medical facility.
- "address": The REAL full street address of the facility.
- "lat": (Optional) The REAL latitude of the facility.
- "lng": (Optional) The REAL longitude of the facility.

Example:
[
  {
    "name": "General City Hospital",
    "address": "123 Health St, Anytown, CA 90210, USA",
    "lat": 34.0522,
    "lng": -118.2437
  },
  {
    "name": "Community Medical Clinic",
    "address": "45 Main Ave, Anytown, CA 90210, USA"
  }
]
If no facilities are found, return an empty array [].
Prioritize actual hospitals. If none, clinics are acceptable. Ensure data is as REALISTIC and ACCURATE as possible.

IMPORTANT: The entire response MUST be a single, valid JSON array. Do not include any text, explanations, or conversational text before or after the JSON.
Strictly adhere to JSON formatting rules, like using double quotes for keys and strings, and avoiding trailing commas.
`;
};

const suggestLocalEmergencyNumbersPrompt = (latitude: number, longitude: number): string => {
  return `
You are an AI assistant providing helpful, but NOT OFFICIALLY VERIFIED, information for travelers.
A user is requesting common emergency numbers for the region around latitude ${latitude.toFixed(4)} and longitude ${longitude.toFixed(4)}.
Based on general knowledge of this region, suggest common emergency numbers.
Structure the response as a JSON object with the following fields:
- "police": (Optional) String for the police emergency number (e.g., "110", "911").
- "ambulance": (Optional) String for the ambulance/medical emergency number (e.g., "119", "911").
- "fire": (Optional) String for the fire department emergency number (e.g., "119", "911").
- "general": (Optional) String for a general emergency number if one covers multiple services (e.g., "112" in Europe, "999" in UK).
- "notes": (Optional) Brief notes about the numbers, e.g., "112 is a general emergency number in many European countries."
- "disclaimer": A MANDATORY disclaimer string. It MUST be: "DISCLAIMER: These numbers are AI-generated suggestions based on the general region and MUST be verified from official local sources before use in an actual emergency. Relying solely on these numbers without verification could be dangerous."

Example:
{
  "police": "110",
  "ambulance": "119",
  "fire": "119",
  "general": "112 (for many European countries in this region)",
  "notes": "Confirm specific local variations if outside a major city.",
  "disclaimer": "DISCLAIMER: These numbers are AI-generated suggestions based on the general region and MUST be verified from official local sources before use in an actual emergency. Relying solely on these numbers without verification could be dangerous."
}

If you cannot confidently determine specific numbers for police/ambulance/fire, you may omit them or provide a general number if known. The disclaimer is ALWAYS required.
The primary goal is to provide a helpful starting point, emphasizing user verification.

IMPORTANT: The entire response MUST be a single, valid JSON object. Do not include any text, explanations, or conversational text before or after the JSON.
Strictly adhere to JSON formatting rules, like using double quotes for keys and strings, and avoiding trailing commas.
`;
};

const fetchNearbyEmbassiesPrompt = (latitude: number, longitude: number, nationality?: string): string => {
  const userNationality = nationality || "US Citizen"; // Default for mock purposes
  return `
You are an AI assistant providing helpful, but NOT OFFICIALLY VERIFIED, information for travelers.
A user identifying as a '${userNationality}' is requesting a list of their nearby embassies or consulates, based on their current location around latitude ${latitude.toFixed(4)} and longitude ${longitude.toFixed(4)}.
Provide a JSON array of up to 2 REALISTIC embassy or consulate locations for the specified nationality.
Each object in the array should have the following fields:
- "id": A unique string ID for the embassy suggestion (e.g., "embassy-uuid-1").
- "name": The REAL name of the embassy or consulate (e.g., "Embassy of [Country of Nationality] in [City, Host Country]").
- "address": The REAL full street address of the embassy/consulate.
- "phone": (Optional) A mock or placeholder phone number (e.g., "+123 456 7890 (Mock)").
- "website": (Optional) A mock or placeholder website URL (e.g., "https://mockembassy.example.com").
- "notes": (Optional) Brief notes, e.g., "Consular services available by appointment."

Example for a US Citizen in Paris:
[
  {
    "id": "embassy-uuid-1",
    "name": "Embassy of the United States in Paris, France",
    "address": "2 Avenue Gabriel, 75008 Paris, France",
    "phone": "+33 1 43 12 22 22 (Mock)",
    "website": "https://fr.usembassy.gov (Mock)",
    "notes": "Nearest major US diplomatic mission."
  }
]

If no specific embassy for the nationality can be realistically placed in the vicinity, or if the nationality is very generic, you can return an empty array [].
CRITICAL: Include a disclaimer as the 'notes' field in AT LEAST ONE of the embassy objects (or as a general note if the array is empty) stating: "This information is AI-generated and MUST be verified with official government sources."
Focus on providing plausible information for demonstration.

IMPORTANT: The entire response MUST be a single, valid JSON array. Do not include any text, explanations, or conversational text before or after the JSON.
Strictly adhere to JSON formatting rules, like using double quotes for keys and strings, and avoiding trailing commas.
`;
};

const generateQuickTourPrompt = (latitude?: number, longitude?: number, userInterests?: UserInterest[]): string => {
    let locationContext = "a diverse and vibrant area of San Francisco, California, USA.";
    if (latitude && longitude) {
        locationContext = `the area around latitude ${latitude.toFixed(4)} and longitude ${longitude.toFixed(4)}.`;
    }

    const timeOfDay = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    let interestContext = "The user is open to any suggestions.";
    if (userInterests && userInterests.length > 0) {
        interestContext = `The user has expressed interest in the following: ${userInterests.join(', ')}. Please try to include places that align with these interests.`;
    }

    return `
You are an expert local guide. A traveler has just arrived in ${locationContext} It is currently ${timeOfDay}. ${interestContext}
Your task is to create a short, efficient walking tour for them that lasts about 2-3 hours. The tour should include 3-4 interesting and authentic stops that are open and suitable for the current time of day.

Please provide a response as a single, valid JSON object with the following structure:
{
  "title": "A short, catchy title for the tour (e.g., 'An Afternoon Stroll in the Mission District')",
  "estimatedCost": "A realistic estimated cost for one person (e.g., 'Free', '$10-20 USD for coffee', 'Approx. $50 USD for entry fees')",
  "estimatedDuration": "A realistic total duration (e.g., 'Approx. 2 hours', '2.5 - 3 hours')",
  "stops": [
    {
      "placeName": "REAL Name of Stop 1 (e.g., 'Dolores Park')",
      "description": "A brief, engaging description of what to do or see here (e.g., 'Start here to soak in the local vibe and enjoy city views.')"
    },
    {
      "placeName": "REAL Name of Stop 2 (e.g., 'Tartine Bakery')",
      "description": "A brief, engaging description (e.g., 'Walk a few blocks to grab a famous pastry and coffee.')"
    },
    {
      "placeName": "REAL Name of Stop 3 (e.g., 'Clarion Alley Mural Project')",
      "description": "A brief, engaging description (e.g., 'Discover vibrant street art in this iconic alley.')"
    }
  ],
  "placeNamesForMap": [
    "REAL Name of Stop 1 (e.g., 'Dolores Park')",
    "REAL Name of Stop 2 (e.g., 'Tartine Bakery')",
    "REAL Name of Stop 3 (e.g., 'Clarion Alley Mural Project')"
  ]
}

IMPORTANT RULES:
1. The places must be REAL and located near the specified coordinates.
2. The "placeNamesForMap" array MUST contain the exact, queryable names of the places for use in a mapping API. It should be an array of strings.
3. The number of stops should be between 3 and 4.

IMPORTANT: The entire response MUST be a single, valid JSON object. Do not include any text, explanations, or conversational text before or after the JSON.
Strictly adhere to JSON formatting rules (e.g., no trailing commas, double quotes for keys and strings).
`;
};

const findSpecificPlacesPrompt = (query: string, latitude: number, longitude: number): string => {
  return `
You are a helpful travel assistant. Your task is to find REAL, relevant public locations for a traveler based on a specific query.
The user's query is: "${query}".
Find these locations in the area around latitude ${latitude.toFixed(4)} and longitude ${longitude.toFixed(4)}.
Focus on places within an approximate 10-kilometer (or 6-mile) radius.
Please provide a JSON array of up to 7 REAL places that best match the query.
Each place object in the array MUST conform to the simplified "Place" structure. Pay special attention to "name", "address", "geometry.location", and "photoUrl".
For the 'photoUrl', use the format:
- "photoUrl": optional; the application will handle images.
If the place name is generic or not found, use the type, city, country, and the user's original query as keywords.
Always ensure the image is as relevant as possible to the place.
Example response for a query "late night pharmacies":
[
  {
    "id": "place-random-uuid-pharm-1",
    "name": "24-Hour City Pharmacy",
    "type": "Pharmacy",
    "rating": 4.2,
    "address": "456 Health Ave, Anytown, CA 90210, USA",
  "photoUrl": "",
    "description": "A reliable 24/7 pharmacy with a wide selection of medications and essentials.",
    "localTip": "The pharmacist here is very helpful for minor ailment advice.",
    "handyPhrase": "Do you have something for a headache?",
    "geometry": { "location": { "lat": 34.0522, "lng": -118.2437 } },
    "opening_hours": { "open_now": true, "weekday_text": ["Monday: Open 24 hours", "Tuesday: Open 24 hours", "...", "Sunday: Open 24 hours"] }
  }
]
If the query is for something like "safe well-lit waiting spots", interpret this and find suitable public places like well-lit parks, 24-hour cafes, or public squares known for being safe.
For each place, provide a realistic 'description' that explains why it's a good match for the user's query.
The entire response MUST be a single, valid JSON array. Do not include any text or explanations.
If no relevant places are found, return an empty array [].
`;
};

const generateLostAndFoundAdvicePrompt = (item: string, city: string): string => {
  return `
You are an extremely helpful and empathetic travel assistant AI.
A traveler has lost their "${item}" in or around the city of ${city}.
Please provide a clear, concise, and actionable list of 3 to 5 steps they should take immediately.
Format the response as a simple string. Use Markdown for lists (e.g., "1. ...") and bolding (e.g., "**Contact your bank**").
The advice should be practical and reassuring. Include general advice and, if possible, mention specific types of places or authorities to contact relevant to a traveler in ${city} (e.g., "visit the main train station's lost property office," "file a report at a local police station (Prefectura)").

Example for "Wallet" in "Tokyo":
"I'm so sorry to hear you've lost your wallet. It's stressful, but let's take these steps to sort it out:

1. **Cancel Your Cards:** Immediately contact your banks to cancel all debit and credit cards that were in the wallet. This is the most critical step to prevent fraud.
2. **Retrace Your Steps:** Think carefully about where you've been. If you used public transport, check the lost and found ('otoshimono') office of the specific train line (e.g., JR, Tokyo Metro). They are very efficient.
3. **Visit a Koban (Police Box):** Go to a nearby 'Koban' (small local police box). They are everywhere in Tokyo and are very helpful. File a lost item report ('ishitsubutsu-todoke'). This official report is often required for insurance.
4. **Check with Your Hotel:** Inform your hotel concierge or front desk. Sometimes items are found and returned there.
5. **Monitor Your Accounts:** Keep a close eye on your bank accounts for any suspicious activity over the next few days.

Stay calm, many items are safely returned in Tokyo. Good luck!"
  `;
};


// --- NEW PROMPTS FOR LOCATION-BASED HOMEPAGE ---

const reverseGeocodePrompt = (latitude: number, longitude: number): string => `
  You are a geocoding service. Based on the coordinates latitude=${latitude} and longitude=${longitude},
  provide the simple city name, country name, and its ISO 3166-1 alpha-2 country code.
  Respond with ONLY a valid JSON object in the format:
  {
    "city": "City Name",
    "country": "Country Name",
    "countryCode": "XX"
  }
  Do not add any explanations or other text.
`;

const fetchSupportLocationsPrompt = (latitude: number, longitude: number): string => `
  You are a travel support database. For the location around latitude ${latitude}, longitude ${longitude},
  find up to 2 real public locations for each of the following support types: 'hospital', 'police' station.
  Also, find 1 'embassy' for a United States citizen.
  Provide the response as a JSON array of support points. Each object must conform to the following structure:
  {
    "id": "A unique string ID, e.g., 'support-xxxx'",
    "name": "The REAL name of the location",
    "type": "The type, which MUST be one of: 'hospital', 'police', 'embassy'",
    "address": "The REAL full street address",
    "geometry": {
      "location": {
        "lat": REAL_LATITUDE,
        "lng": REAL_LONGITUDE
      }
    }
  }
  If you cannot find a location for a type, do not include it. Aim for a total of 3-5 locations.
  IMPORTANT: The entire response MUST be a single, valid JSON array. Do not include any text, explanations, or conversational text before or after the JSON. Strictly adhere to JSON formatting rules.
`;

const fetchLocalInfoPrompt = (latitude: number, longitude: number): string => `
  You are a local travel advisor AI. For the location around latitude ${latitude}, longitude ${longitude}, provide a JSON object with local information.
  The response must be a single JSON object with this exact structure:
  {
    "weather": "A string describing current weather, e.g., '24°C, Sunny'",
    "localTime": "A string for the local time with timezone, e.g., '14:30 (GMT+2)'",
    "currencyInfo": "A string with local currency info, e.g., 'Local Currency: Thai Baht (THB)'",
    "alerts": [
      {
        "title": "A short alert title",
        "description": "A brief description of the alert or tip.",
        "severity": "A severity level, which MUST be one of 'low', 'medium', 'high'"
      }
    ]
  }
  The 'alerts' array should contain 2-3 current, relevant travel advisories (e.g., transport strikes, common scams, weather warnings).
  If there are no major alerts, provide 2-3 low-severity tips (e.g., 'Tipping is not customary', 'Stay hydrated').
  IMPORTANT: The entire response MUST be a single, valid JSON object. Do not include any text, explanations, or conversational text before or after the JSON. Strictly adhere to JSON formatting rules.
`;

// Helper function to process Gemini response
export const processResponse = <T>(response: GenerateContentResponse, promptType: string): T => {
  const rawText = response.text;
  if (!rawText) {
    console.error(`Gemini API Error for ${promptType}: No text in response. Full response:`, response);
    throw new Error(`Failed to get a valid response from AI for ${promptType}. The response was empty.`);
  }

  let jsonStr = rawText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error(`Error parsing JSON for ${promptType}:`, e);
    console.error(`Original AI response text for ${promptType} (after fence removal attempt):`, jsonStr);
    console.error(`Full AI response object for ${promptType}:`, response);
    
    let errorMessage = `Failed to parse AI's response for ${promptType}.`;
    if (e instanceof SyntaxError) {
      errorMessage += ` Details: ${e.message}.`;
      // Try to find the problematic part if possible (very basic)
      const positionMatch = e.message.match(/position (\d+)/);
      if (positionMatch && positionMatch[1]) {
        const errorPos = parseInt(positionMatch[1], 10);
        const contextChars = 20;
        const start = Math.max(0, errorPos - contextChars);
        const end = Math.min(jsonStr.length, errorPos + contextChars);
        const errorContext = jsonStr.substring(start, end);
        errorMessage += ` Near: "...${errorContext}..."`;
      }
    }
    throw new Error(errorMessage);
  }
};

// Generic error handler for API calls
const handleApiError = (error: any, functionName: string): Error => {
  console.error(`Error in ${functionName} from Gemini API:`, error);
  let UIMessage = `Error in ${functionName}: Unknown error.`;

  if (typeof error === 'object' && error !== null) {
    const nestedError = (error as any).error;
    if (typeof nestedError === 'object' && nestedError !== null && 'code' in nestedError && 'message' in nestedError) {
      const code = nestedError.code;
      const message = nestedError.message;
      
      if (code === 429 || String(message).toLowerCase().includes("quota") || String(message).toLowerCase().includes("resource_exhausted")) {
        // Check if it's a daily quota exceeded error
        if (String(message).toLowerCase().includes("exceeded your current quota") || 
            String(message).toLowerCase().includes("quota_value") ||
            String(message).toLowerCase().includes("free_tier")) {
          UIMessage = "Daily API quota exceeded. The free tier allows 250 requests per day. Please try again tomorrow or upgrade your plan.";
        } else {
          UIMessage = "The AI service is currently experiencing high demand or the quota has been exceeded. Please try again in a few minutes.";
        }
      } else if (String(message).toLowerCase().includes("api key not valid")) {
        UIMessage = `Failed to call ${functionName}: Invalid API Key. Please check your configuration.`;
      } else if (code === 503 || String(message).toLowerCase().includes("overloaded")) {
        UIMessage = "The AI service is temporarily overloaded. Please try again in a few moments.";
      } else {
        UIMessage = `API Error in ${functionName} (${code}): ${message}`;
      }
    } else if ('message' in (error as any)) { // Simpler error object with just a message
      UIMessage = (error as any).message;
       if (UIMessage.toLowerCase().includes("api key not valid")) {
           UIMessage = `Failed to call ${functionName}: Invalid API Key. Please check your configuration.`;
       } else if (UIMessage.includes("429") || UIMessage.toLowerCase().includes("quota") || UIMessage.toLowerCase().includes("resource_exhausted")) {
           if (UIMessage.toLowerCase().includes("exceeded your current quota") || 
               UIMessage.toLowerCase().includes("quota_value") ||
               UIMessage.toLowerCase().includes("free_tier")) {
             UIMessage = "Daily API quota exceeded. The free tier allows 250 requests per day. Please try again tomorrow or upgrade your plan.";
           } else {
             UIMessage = "The AI service is currently experiencing high demand or the quota has been exceeded. Please try again in a few minutes.";
           }
       }
    }
  } else if (typeof error === 'string') {
    UIMessage = error;
  }
  
  return new Error(UIMessage);
};

// --- BATCH-OPTIMIZED `fetchNearbyPlaces` ---
export const fetchNearbyPlaces = async (latitude?: number, longitude?: number, userInterests?: UserInterest[], searchQuery?: string): Promise<Place[]> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");

  const lat = latitude || 37.7749; // Default SF
  const lng = longitude || -122.4194;

  try {
    // Step 1: Get factual place data from Gemini AI
    const keywords = searchQuery ? [searchQuery] : (userInterests && userInterests.length > 0 ? userInterests : ['popular tourist attractions']);
    const keyword = keywords.join(' ').trim();
    
    const placesPrompt = `Find 5 real places near latitude ${lat}, longitude ${lng} matching: "${keyword}". Return as JSON array:
[
  {
    "place_id": "unique-id",
    "name": "Real place name",
    "formatted_address": "Full address",
    "types": ["establishment", "point_of_interest"],
    "geometry": { "location": { "lat": ${lat}, "lng": ${lng} } },
    "rating": 4.2,
    "user_ratings_total": 150,
    "business_status": "OPERATIONAL"
  }
]`;
    
    const placesResponse = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: placesPrompt,
      config: { responseMimeType: 'application/json' }
    });
    
    const factualPlaces = processResponse<Partial<Place>[]>(placesResponse, 'fetchNearbyPlaces');

    if (!factualPlaces || factualPlaces.length === 0) {
        return [];
    }

    // Step 2: Enrich ALL places with a SINGLE, batched Gemini call
    const enrichmentPrompt = enrichMultiplePlaceDetailsPrompt(factualPlaces);
    const enrichmentResponse = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: enrichmentPrompt,
      config: { responseMimeType: 'application/json' },
    });
    
    // The creative content will be an array of objects, each with an 'id' that must match place_id
    const creativeContents = processResponse<Array<Partial<Place> & { id: string }>>(enrichmentResponse, 'enrichMultiplePlaceDetails');

    // Create a map for efficient O(1) lookups
    const creativeMap = new Map(creativeContents.map(c => [c.id, c]));

    // Step 3: Combine factual and creative data
    const combinedPlaces = factualPlaces.map(placeFacts => {
      if (!placeFacts.place_id) return null;
      const creativeContent = creativeMap.get(placeFacts.place_id);

      if (!creativeContent) {
        console.warn(`No creative content found for place ID: ${placeFacts.place_id}. Skipping place.`);
        return null;
      }

      const photoRef = placeFacts.additional_photos?.[0]?.photo_reference;
      const photoUrl = photoRef
          ? ''
          : '';
      
      const name = placeFacts.name || 'Unknown Place';

      const combinedPlace: Place = {
        ...placeFacts,
        ...creativeContent,
        id: placeFacts.place_id, // Ensure the final ID is the correct one from the factual source
        name: name,
        address: placeFacts.formatted_address || 'Unknown Address',
        rating: placeFacts.rating || 4.0,
        photoUrl: photoUrl,
        type: creativeContent.type || (placeFacts.types && placeFacts.types.length > 0 ? placeFacts.types[0].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Point of Interest'),
        description: creativeContent.description || `An interesting place to visit: ${name}.`,
        localTip: creativeContent.localTip || 'Check online for opening hours before you visit.',
        handyPhrase: creativeContent.handyPhrase || 'Hello, how are you?',
      };
      
      if (combinedPlace.deal) {
        combinedPlace.deal.placeName = combinedPlace.name;
      }

      return combinedPlace;
    }).filter((p): p is Place => p !== null); // Filter out any places that failed to be combined

    return combinedPlaces;

  } catch (error) {
    throw handleApiError(error, 'fetchNearbyPlaces');
  }
};


// --- Exported API-calling Functions ---

export const generateItinerary = async (places: Place[]): Promise<ItinerarySuggestion> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = generateItineraryPrompt(places);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const itinerary = processResponse<Omit<ItinerarySuggestion, 'id'>>(response, 'generateItinerary');
    return { ...itinerary, id: `itinerary-${Date.now()}` }; // Add a unique ID
  } catch (error) {
    throw handleApiError(error, 'generateItinerary');
  }
};

export const generateComprehensiveTripPlan = async (
  destination: string,
  duration: string,
  interests?: string,
  pace?: TripPace,
  travelStyles?: TravelStyle[],
  budget?: BudgetLevel,
  enhancedOptions?: any
): Promise<TripPlanSuggestion> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  
  // Use enhanced service if options provided
  if (enhancedOptions) {
    const { enhancedTripPlanningService } = await import('./enhancedTripPlanningService.ts');
    return enhancedTripPlanningService.generateEnhancedTripPlan(
      destination, duration, interests || '', pace || TripPace.Moderate, 
      travelStyles || [], budget || BudgetLevel.MidRange, enhancedOptions
    );
  }
  
  try {
    const prompt = generateComprehensiveTripPlanPrompt(destination, duration, interests, pace, travelStyles, budget);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const plan = processResponse<Omit<TripPlanSuggestion, 'id'>>(response, 'generateComprehensiveTripPlan');
    return { ...plan, id: `trip-${Date.now()}` }; // Add a unique ID
  } catch (error) {
    throw handleApiError(error, 'generateComprehensiveTripPlan');
  }
};

export const generateLocalAgencyPlan = async (
  location: string,
  planType: string,
  interests: string
): Promise<LocalAgencyPlan> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = generateLocalAgencyPlanPrompt(location, planType, interests);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const plan = processResponse<Omit<LocalAgencyPlan, 'id'>>(response, 'generateLocalAgencyPlan');
    return { ...plan, id: `local-agency-plan-${Date.now()}` }; // Add a unique ID
  } catch (error) {
    throw handleApiError(error, 'generateLocalAgencyPlan');
  }
};

export const generateSurpriseSuggestion = async (): Promise<SurpriseSuggestion> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = generateSurpriseSuggestionPrompt();
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    return processResponse<SurpriseSuggestion>(response, 'generateSurpriseSuggestion');
  } catch (error) {
    throw handleApiError(error, 'generateSurpriseSuggestion');
  }
};

export const askQuestionAboutPlace = async (place: Place, question: string): Promise<string> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = askQuestionAboutPlacePrompt(place, question);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
    });
    return response.text || ''; // Ensure we return a string
  } catch (error) {
    throw handleApiError(error, 'askQuestionAboutPlace');
  }
};

export const fetchPlaceRecommendations = async (place: Place): Promise<PlaceSummary[]> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = fetchPlaceRecommendationsPrompt(place);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    return processResponse<PlaceSummary[]>(response, 'fetchPlaceRecommendations');
  } catch (error) {
    throw handleApiError(error, 'fetchPlaceRecommendations');
  }
};

export const fetchNearbyHospitals = async (latitude: number, longitude: number): Promise<HospitalInfo[]> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = fetchNearbyHospitalsPrompt(latitude, longitude);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    return processResponse<HospitalInfo[]>(response, 'fetchNearbyHospitals');
  } catch (error) {
    throw handleApiError(error, 'fetchNearbyHospitals');
  }
};

export const suggestLocalEmergencyNumbers = async (latitude: number, longitude: number): Promise<SuggestedEmergencyNumbers> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = suggestLocalEmergencyNumbersPrompt(latitude, longitude);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    return processResponse<SuggestedEmergencyNumbers>(response, 'suggestLocalEmergencyNumbers');
  } catch (error) {
    throw handleApiError(error, 'suggestLocalEmergencyNumbers');
  }
};

export const fetchNearbyEmbassies = async (latitude: number, longitude: number, nationality: string): Promise<EmbassyInfo[]> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = fetchNearbyEmbassiesPrompt(latitude, longitude, nationality);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    return processResponse<EmbassyInfo[]>(response, 'fetchNearbyEmbassies');
  } catch (error) {
    throw handleApiError(error, 'fetchNearbyEmbassies');
  }
};

export const generateQuickTour = async (latitude?: number, longitude?: number, userInterests?: UserInterest[]): Promise<QuickTourPlan> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = generateQuickTourPrompt(latitude, longitude, userInterests);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    return processResponse<QuickTourPlan>(response, 'generateQuickTour');
  } catch (error) {
    throw handleApiError(error, 'generateQuickTour');
  }
};

export const reverseGeocode = async (latitude: number, longitude: number): Promise<{city: string; country: string; countryCode: string;}> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = reverseGeocodePrompt(latitude, longitude);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return processResponse<{city: string; country: string; countryCode: string}>(response, 'reverseGeocode');
  } catch (error) {
    throw handleApiError(error, 'reverseGeocode');
  }
};

export const fetchSupportLocations = async (latitude: number, longitude: number): Promise<SupportPoint[]> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = fetchSupportLocationsPrompt(latitude, longitude);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return processResponse<SupportPoint[]>(response, 'fetchSupportLocations');
  } catch (error) {
    throw handleApiError(error, 'fetchSupportLocations');
  }
};

export const fetchLocalInfo = async (latitude: number, longitude: number): Promise<LocalInfo> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = fetchLocalInfoPrompt(latitude, longitude);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return processResponse<LocalInfo>(response, 'fetchLocalInfo');
  } catch (error) {
    throw handleApiError(error, 'fetchLocalInfo');
  }
};

export const findSpecificPlaces = async (query: string, latitude: number, longitude: number): Promise<Place[]> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = findSpecificPlacesPrompt(query, latitude, longitude);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return processResponse<Place[]>(response, 'findSpecificPlaces');
  } catch (error) {
    throw handleApiError(error, 'findSpecificPlaces');
  }
};

export const generateLostAndFoundAdvice = async (item: string, city: string): Promise<string> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const prompt = generateLostAndFoundAdvicePrompt(item, city);
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
    });
    return response.text || ''; // Ensure we return a string
  } catch (error) {
    throw handleApiError(error, 'generateLostAndFoundAdvice');
  }
};

export const fetchAttractionPlaces = async (latitude: number, longitude: number, category: string, searchQuery?: string): Promise<Place[]> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  
  const categoryMap = {
    landmarks: 'historical sites, monuments, landmarks, famous buildings',
    culture: 'museums, art galleries, cultural centers, theaters, heritage sites',
    nature: 'parks, gardens, beaches, hiking trails, natural attractions, viewpoints'
  };
  
  const categoryKeywords = categoryMap[category as keyof typeof categoryMap] || 'tourist attractions';
  const query = searchQuery ? `${searchQuery} ${categoryKeywords}` : categoryKeywords;
  
  const prompt = `Find 5 real ${query} near latitude ${latitude}, longitude ${longitude}. Return as JSON array with this exact structure:
[
  {
    "id": "unique-id",
    "name": "Real place name",
    "type": "Category type",
    "address": "Full address",
    "description": "Engaging 2-3 sentence description",
    "localTip": "Useful local tip",
    "handyPhrase": "Common phrase tourists use",
    "rating": 4.2,
    "geometry": { "location": { "lat": ${latitude}, "lng": ${longitude} } }
  }
]`;
  
  try {
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const places = processResponse<Place[]>(response, 'fetchAttractionPlaces');
    
    // Fetch images using the existing image API
  // Image fetching via Unsplash removed
    const placesWithImages = await Promise.all(
      places.map(async (place) => {
        try {
          const imageUrls: string[] = [];
          return {
            ...place,
            image: imageUrls[0] || undefined,
            heroImage: imageUrls[0] || undefined,
            photoUrl: imageUrls[0] || ''
          };
        } catch (error) {
          return {
            ...place,
            image: undefined,
            heroImage: undefined,
            photoUrl: ''
          };
        }
      })
    );
    
    return placesWithImages;
  } catch (error) {
    throw handleApiError(error, 'fetchAttractionPlaces');
  }
};

export const fetchFlightInfo = async (flightNumber: string, question: string): Promise<GenerateContentResponse> => {
  if (!(apiKey as string)) throw new Error("API key is missing.");
  try {
    const contents = `The user is asking for help with flight ${flightNumber}. Their question is: "${question}". Provide helpful information based on the latest available data, including status, gate information, and baggage claim if possible. If the question is about compensation or airline policy for delays/cancellations, provide general advice.`;
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response;
  } catch (error) {
    throw handleApiError(error, 'fetchFlightInfo');
  }
};

// --- Mock Community Photo Functions ---

export const fetchCommunityPhotos = async (): Promise<CommunityPhoto[]> => {
  console.log("Fetching community photos (mock)...");
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
  const storedPhotos = localStorage.getItem(LOCAL_STORAGE_COMMUNITY_PHOTOS_KEY);
  if (storedPhotos) {
      try {
          const photos = JSON.parse(storedPhotos);
          if (Array.isArray(photos)) return photos;
      } catch(e) { console.error("Could not parse stored photos", e); }
  }
  // If nothing stored or parse fails, use some default mock data with more relevant images
  return [
  { id: 'comm-photo-1', imageUrl: '', caption: 'Beautiful sunset over the bay!', uploaderName: 'TravelerJane', likes: 125, uploadedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'comm-photo-2', imageUrl: '', caption: 'Found this hidden waterfall today.', uploaderName: 'AdventurerAlex', likes: 230, uploadedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'comm-photo-3', imageUrl: '', caption: 'Amazing street food tour.', uploaderName: 'FoodieFrank', likes: 88, uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  ];
};


export const uploadCommunityPhoto = async (data: CommunityPhotoUploadData, uploaderName: string): Promise<CommunityPhoto> => {
    console.log("Uploading community photo (mock)...", data);
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate upload delay

    if (data.caption && data.caption.toLowerCase().includes('fail')) {
        throw new Error("Mock upload failure: Caption contains 'fail'.");
    }

    const newPhoto: CommunityPhoto = {
        id: `comm-photo-${Date.now()}`,
        imageUrl: data.imageDataUrl, // In a real app, this would be a URL from a storage service
        caption: data.caption,
        uploaderName: uploaderName,
        likes: 0,
        uploadedAt: new Date().toISOString(),
        placeId: data.placeId,
    };
    
    // Simulate saving to localStorage
    const storedPhotos = localStorage.getItem(LOCAL_STORAGE_COMMUNITY_PHOTOS_KEY);
    let photos: CommunityPhoto[] = [];
    if (storedPhotos) {
        try {
            photos = JSON.parse(storedPhotos);
        } catch(e) { /* ignore */ }
    }
    const updatedPhotos = [newPhoto, ...photos];
    localStorage.setItem(LOCAL_STORAGE_COMMUNITY_PHOTOS_KEY, JSON.stringify(updatedPhotos));

    return newPhoto;
};