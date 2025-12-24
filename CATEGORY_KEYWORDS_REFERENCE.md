# Category Keywords Reference

## 🗂️ Complete Keyword Mapping

This document shows the exact keywords used for filtering "tourist attraction" results by category.

## 📋 Category Definitions

### 🍽️ Restaurant / Food
**Category Key**: `restaurant`

**Keywords**:
- restaurant
- cafe
- food
- dining
- eatery

**Matches**:
- "Joe's Restaurant"
- "Starbucks Cafe"
- "Street Food Market"
- "Fine Dining Experience"
- "Local Eatery"

---

### 🏨 Hotel / Accommodation
**Category Key**: `hotel`

**Keywords**:
- hotel
- hostel
- accommodation
- resort
- lodging

**Matches**:
- "Hilton Hotel"
- "Backpacker Hostel"
- "Beach Resort"
- "Guest House"
- "Luxury Lodging"

---

### 🏛️ Landmark / Attraction
**Category Key**: `landmark`

**Keywords**:
- landmark
- monument
- attraction
- historic

**Matches**:
- "Eiffel Tower"
- "War Monument"
- "Tourist Attraction"
- "Historic Site"
- "Famous Landmark"

---

### 🎨 Museum / Culture
**Category Key**: `museum`

**Keywords**:
- museum
- gallery
- art
- cultural

**Matches**:
- "National Museum"
- "Art Gallery"
- "Cultural Center"
- "Science Museum"
- "Contemporary Art Space"

---

### 🌳 Park / Nature
**Category Key**: `park`

**Keywords**:
- park
- garden
- nature
- outdoor
- beach

**Matches**:
- "Central Park"
- "Botanical Garden"
- "Nature Reserve"
- "Outdoor Recreation"
- "Beach Park"

---

### 🎭 Entertainment
**Category Key**: `entertainment`

**Keywords**:
- cinema
- theater
- entertainment
- concert

**Matches**:
- "Movie Cinema"
- "Broadway Theater"
- "Entertainment Complex"
- "Concert Hall"
- "Performance Venue"

---

### 🍺 Bar / Nightlife
**Category Key**: `bar`

**Keywords**:
- bar
- pub
- nightclub
- lounge
- nightlife

**Matches**:
- "Sports Bar"
- "Irish Pub"
- "Nightclub"
- "Rooftop Lounge"
- "Nightlife District"

---

### 🛍️ Shopping
**Category Key**: `shopping`

**Keywords**:
- shopping
- mall
- market
- store
- boutique

**Matches**:
- "Shopping Mall"
- "Local Market"
- "Department Store"
- "Fashion Boutique"
- "Shopping District"

---

### 💆 Spa / Wellness
**Category Key**: `spa`

**Keywords**:
- spa
- wellness
- massage
- beauty
- salon

**Matches**:
- "Day Spa"
- "Wellness Center"
- "Massage Parlor"
- "Beauty Salon"
- "Health Spa"

---

### 🌄 Viewpoint / Scenic
**Category Key**: `viewpoint`

**Keywords**:
- viewpoint
- scenic
- observation
- lookout
- rooftop

**Matches**:
- "Scenic Viewpoint"
- "Observation Deck"
- "Mountain Lookout"
- "Rooftop Bar"
- "Scenic Overlook"

---

## 🔍 How Filtering Works

### Step 1: Fetch Base Results
```
Google API Query: "tourist attraction"
Results: 60 places (all types)
```

### Step 2: Apply Category Filter
```dart
// User selects "Food" category
categoryFilter = "restaurant"
keywords = ["restaurant", "cafe", "food", "dining", "eatery"]

// Filter logic
for (place in places) {
  searchText = "${place.name} ${place.types} ${place.description}".toLowerCase()
  
  if (keywords.any((k) => searchText.contains(k))) {
    // Include this place
  }
}
```

### Step 3: Return Filtered Results
```
Filtered Results: 15 places (food-related only)
```

## 🌦️ Weather-Aware Keywords

### Rainy Day Adjustments
```dart
if (isRainy) {
  // Remove outdoor keywords
  remove: ['beach', 'outdoor', 'park']
  
  // Boost indoor keywords
  boost: ['museum', 'shopping', 'cinema', 'spa']
}
```

### Evening Adjustments
```dart
if (isEvening) {
  // Boost nightlife keywords
  boost: ['bar', 'pub', 'nightclub', 'lounge']
  
  // Add to food category
  food.add(['bar', 'pub'])
}
```

### Hot Day Adjustments
```dart
if (isHot) {
  // Boost cooling keywords
  boost: ['beach', 'pool', 'water park', 'ice cream']
  
  // Add to nature category
  nature.add(['swimming', 'water'])
}
```

## 📊 Keyword Match Scoring

### Basic Match (Score: +10)
```
Place name contains keyword
Example: "Joe's Restaurant" matches "restaurant"
```

### Type Match (Score: +20)
```
Place type contains keyword
Example: types: ["restaurant", "food"] matches "restaurant"
```

### Description Match (Score: +5)
```
Place description contains keyword
Example: "A cozy cafe serving..." matches "cafe"
```

### Multiple Matches (Score: Cumulative)
```
Place: "Beachside Cafe & Restaurant"
Matches: "cafe" (+10) + "restaurant" (+10) = +20 total
```

## 🎯 Category Priority

When a place matches multiple categories, prioritize by:

1. **Primary Type** (Google's main classification)
2. **Keyword Frequency** (how many times keywords appear)
3. **User Preference** (based on history)
4. **Rating** (higher rated = higher priority)

### Example: "Hard Rock Cafe"
```
Matches:
- restaurant ✓ (name contains "cafe")
- bar ✓ (types include "bar")
- entertainment ✓ (types include "night_club")

Priority:
1. restaurant (primary type)
2. bar (secondary type)
3. entertainment (tertiary type)
```

## 🔧 Customization

### Adding New Categories
```dart
// 1. Add to categoryKeywords map
'coffee': ['coffee', 'espresso', 'cappuccino', 'latte'],

// 2. Add to UI filter chips
FilterChip(label: 'Coffee', value: 'coffee')

// 3. Test filtering
final coffeeShops = _filterByCategory(places, 'coffee', 'coffee');
```

### Modifying Existing Keywords
```dart
// Add more specific keywords
'restaurant': [
  'restaurant', 'cafe', 'food', 'dining', 'eatery',
  'bistro', 'brasserie', 'diner', 'grill' // NEW
],
```

## 📝 Best Practices

### ✅ DO
- Use lowercase keywords
- Include common variations
- Keep keywords specific
- Test with real data
- Monitor match rates

### ❌ DON'T
- Use too generic keywords (e.g., "place")
- Overlap categories too much
- Use special characters
- Make keywords too long
- Forget to test edge cases

## 🧪 Testing Keywords

### Test Cases
```dart
// Test 1: Exact match
place.name = "Joe's Restaurant"
category = "restaurant"
expected = true ✓

// Test 2: Partial match
place.name = "Beachside Cafe"
category = "restaurant"
expected = true ✓ (cafe is a keyword)

// Test 3: Type match
place.types = ["restaurant", "food"]
category = "restaurant"
expected = true ✓

// Test 4: No match
place.name = "City Park"
category = "restaurant"
expected = false ✓

// Test 5: Multiple categories
place.name = "Rooftop Bar & Restaurant"
categories = ["restaurant", "bar"]
expected = true for both ✓
```

## 📚 References

- Google Place Types: https://developers.google.com/maps/documentation/places/web-service/supported_types
- Keyword Research: https://trends.google.com
- User Behavior: Analytics data

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: ✅ Active
