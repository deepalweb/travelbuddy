# Places Enrichment - Quick Start Guide

## 🚀 Quick Start (5 minutes)

### 1. Setup Environment
```bash
# Add to .env file
OPENAI_API_KEY=sk-proj-your-key-here
```

### 2. Test the API
```bash
# Start backend
cd backend
npm run dev

# Test enrichment (in another terminal)
curl -X POST http://localhost:5000/api/places-enrichment/enrich \
  -H "Content-Type: application/json" \
  -d '{
    "place": {
      "place_id": "test123",
      "name": "Central Park",
      "types": ["park"],
      "city": "New York",
      "country": "USA",
      "rating": 4.8,
      "user_ratings_total": 150000
    }
  }'
```

## 📱 Mobile Integration (Flutter)

### Step 1: Create Service
```dart
// lib/services/places_enrichment_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class PlacesEnrichmentService {
  final String baseUrl = 'http://your-api.com';
  
  Future<Map<String, dynamic>> enrichPlace(
    Map<String, dynamic> place,
    {String language = 'en'}
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/places-enrichment/enrich'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'place': place, 'language': language}),
      );
      
      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        return result['data']['enrichment'];
      }
      
      throw Exception('Failed to enrich place');
    } catch (e) {
      print('Enrichment error: $e');
      return _getFallback(place);
    }
  }
  
  Map<String, dynamic> _getFallback(Map<String, dynamic> place) {
    return {
      'shortDescription': '${place['name']} is a popular destination.',
      'whyVisit': 'Popular with travelers for its location and amenities.',
      'bestTimeToVisit': 'Visit during regular hours.',
      'localTip': 'Check recent reviews for current conditions.',
      'safetyNote': 'Follow standard travel safety practices.',
      'fallback': true
    };
  }
}
```

### Step 2: Use in Place Details Screen
```dart
// lib/screens/place_details_screen.dart
class PlaceDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> place;
  
  @override
  _PlaceDetailsScreenState createState() => _PlaceDetailsScreenState();
}

class _PlaceDetailsScreenState extends State<PlaceDetailsScreen> {
  final _enrichmentService = PlacesEnrichmentService();
  Map<String, dynamic>? _enrichment;
  bool _loading = true;
  
  @override
  void initState() {
    super.initState();
    _loadEnrichment();
  }
  
  Future<void> _loadEnrichment() async {
    final enrichment = await _enrichmentService.enrichPlace(widget.place);
    setState(() {
      _enrichment = enrichment;
      _loading = false;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.place['name'])),
      body: _loading
        ? Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Basic Info
                Text(widget.place['name'], style: Theme.of(context).textTheme.headlineMedium),
                SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.star, color: Colors.amber, size: 20),
                    Text(' ${widget.place['rating']} (${widget.place['user_ratings_total']} reviews)'),
                  ],
                ),
                
                SizedBox(height: 24),
                
                // AI Enrichment
                if (_enrichment != null) ...[
                  _buildSection('About', _enrichment!['shortDescription']),
                  _buildSection('Why Visit', _enrichment!['whyVisit']),
                  _buildSection('Best Time to Visit', _enrichment!['bestTimeToVisit']),
                  _buildSection('Local Tip', _enrichment!['localTip'], Icons.lightbulb_outline),
                  _buildSection('Safety', _enrichment!['safetyNote'], Icons.security),
                  
                  if (_enrichment!['cached'] == true)
                    Padding(
                      padding: EdgeInsets.only(top: 16),
                      child: Text('⚡ Instant response (cached)', 
                        style: TextStyle(color: Colors.grey, fontSize: 12)),
                    ),
                ],
              ],
            ),
          ),
    );
  }
  
  Widget _buildSection(String title, String content, [IconData? icon]) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 20, color: Theme.of(context).primaryColor),
                SizedBox(width: 8),
              ],
              Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          SizedBox(height: 8),
          Text(content, style: TextStyle(fontSize: 14, height: 1.5)),
        ],
      ),
    );
  }
}
```

## 🌐 Web Integration (React)

### Step 1: Create Hook
```typescript
// src/hooks/usePlaceEnrichment.ts
import { useState, useEffect } from 'react';

interface Place {
  place_id: string;
  name: string;
  types: string[];
  city?: string;
  country?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
}

interface Enrichment {
  shortDescription: string;
  whyVisit: string;
  bestTimeToVisit: string;
  localTip: string;
  safetyNote: string;
  cached?: boolean;
  fallback?: boolean;
}

export function usePlaceEnrichment(place: Place, language = 'en') {
  const [enrichment, setEnrichment] = useState<Enrichment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnrichment() {
      try {
        const response = await fetch('/api/places-enrichment/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ place, language })
        });

        const result = await response.json();
        
        if (result.success) {
          setEnrichment(result.data.enrichment);
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load enrichment');
        // Set fallback
        setEnrichment({
          shortDescription: `${place.name} is a popular destination.`,
          whyVisit: 'Popular with travelers for its location and amenities.',
          bestTimeToVisit: 'Visit during regular hours.',
          localTip: 'Check recent reviews for current conditions.',
          safetyNote: 'Follow standard travel safety practices.',
          fallback: true
        });
      } finally {
        setLoading(false);
      }
    }

    fetchEnrichment();
  }, [place.place_id, language]);

  return { enrichment, loading, error };
}
```

### Step 2: Use in Component
```typescript
// src/components/PlaceDetails.tsx
import React from 'react';
import { usePlaceEnrichment } from '../hooks/usePlaceEnrichment';

interface PlaceDetailsProps {
  place: Place;
}

export function PlaceDetails({ place }: PlaceDetailsProps) {
  const { enrichment, loading } = usePlaceEnrichment(place);

  if (loading) {
    return <div className="animate-pulse">Loading details...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <h1 className="text-3xl font-bold">{place.name}</h1>
        <div className="flex items-center mt-2">
          <span className="text-yellow-500">★</span>
          <span className="ml-1">{place.rating}/5</span>
          <span className="ml-2 text-gray-500">
            ({place.user_ratings_total?.toLocaleString()} reviews)
          </span>
        </div>
      </div>

      {/* AI Enrichment */}
      {enrichment && (
        <>
          <Section title="About" icon="📍">
            {enrichment.shortDescription}
          </Section>

          <Section title="Why Visit" icon="✨">
            {enrichment.whyVisit}
          </Section>

          <Section title="Best Time to Visit" icon="🕐">
            {enrichment.bestTimeToVisit}
          </Section>

          <Section title="Local Tip" icon="💡" highlight>
            {enrichment.localTip}
          </Section>

          <Section title="Safety" icon="🛡️">
            {enrichment.safetyNote}
          </Section>

          {enrichment.cached && (
            <p className="text-sm text-gray-500">⚡ Instant response (cached)</p>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, icon, children, highlight = false }: any) {
  return (
    <div className={`p-4 rounded-lg ${highlight ? 'bg-blue-50 border border-blue-200' : ''}`}>
      <h3 className="font-semibold text-lg mb-2">
        <span className="mr-2">{icon}</span>
        {title}
      </h3>
      <p className="text-gray-700 leading-relaxed">{children}</p>
    </div>
  );
}
```

## 💰 Cost Optimization Tips

### 1. Cache on Client Side
```typescript
// Cache enrichments in localStorage
const CACHE_KEY = `enrichment_${place.place_id}_${language}`;
const cached = localStorage.getItem(CACHE_KEY);

if (cached) {
  const { data, timestamp } = JSON.parse(cached);
  const age = Date.now() - timestamp;
  
  // Use cache if less than 30 days old
  if (age < 30 * 24 * 60 * 60 * 1000) {
    return data;
  }
}
```

### 2. Batch Requests
```typescript
// Instead of 10 separate calls
places.forEach(place => enrichPlace(place)); // ❌ Expensive

// Do this
enrichPlaces(places.slice(0, 10)); // ✅ Single API call
```

### 3. Lazy Load
```typescript
// Only enrich when user opens details
<PlaceCard 
  onClick={() => navigate(`/place/${place.place_id}`)} // Enrich here
/>
```

## 📊 Monitor Performance

### Check Metrics Dashboard
```typescript
async function getMetrics() {
  const response = await fetch('/api/places-enrichment/metrics');
  const result = await response.json();
  
  console.log('Cache Hit Rate:', result.metrics.cacheHitRate);
  console.log('Total Cost:', result.metrics.estimatedCostUSD);
  console.log('Avg Tokens:', result.metrics.avgTokensPerPlace);
}
```

### Expected Metrics (Production)
- Cache Hit Rate: 80-90%
- Cost per 1000 places: $0.06 (with cache) vs $0.45 (without)
- Avg Response Time: <100ms (cached), <2s (new)

## 🐛 Troubleshooting

### Issue: "OPENAI_API_KEY not found"
```bash
# Add to backend/.env
OPENAI_API_KEY=sk-proj-...
```

### Issue: High costs
```typescript
// Check if caching is working
const metrics = await fetch('/api/places-enrichment/metrics').then(r => r.json());
console.log('Cache hit rate:', metrics.metrics.cacheHitRate);

// Should be >80%. If not, check:
// 1. Are you using same place_id?
// 2. Is cache being cleared?
// 3. Are you using batch endpoint?
```

### Issue: Poor quality enrichments
```typescript
// Check validation failures
const metrics = await fetch('/api/places-enrichment/metrics').then(r => r.json());
console.log('Failures:', metrics.metrics.failures);

// If high, check:
// 1. Is place data complete?
// 2. Are types array populated?
// 3. Is OpenAI API responding?
```

## 🎯 Best Practices

1. **Always use batch endpoint** for multiple places
2. **Cache on client side** for 30 days
3. **Lazy load enrichments** (only when needed)
4. **Monitor metrics** weekly
5. **Handle fallbacks gracefully** (never show errors to users)
6. **Use appropriate language** based on user locale
7. **Test with real data** before production

---

**Ready to go!** 🚀 Start enriching your places now.
