// Sample dishes to seed the database
const sampleDishes = [
  {
    name: "Pad Thai",
    description: "Thailand's national dish - stir-fried rice noodles with shrimp, tofu, eggs, and a tangy tamarind sauce",
    cuisine: "Thai",
    location: {
      city: "Bangkok",
      country: "Thailand",
      coordinates: { lat: 13.7563, lng: 100.5018 }
    },
    ingredients: ["Rice noodles", "Shrimp", "Tofu", "Eggs", "Bean sprouts", "Tamarind paste", "Fish sauce", "Palm sugar"],
    preparationTime: "30 minutes",
    difficulty: "Medium",
    servings: 4,
    image: "https://images.unsplash.com/photo-1559314809-0f31657def5e?w=400",
    recipe: {
      instructions: [
        "Soak rice noodles in warm water until soft",
        "Heat oil in wok, add garlic and shrimp",
        "Add noodles and sauce mixture",
        "Stir in eggs and bean sprouts",
        "Garnish with lime and peanuts"
      ],
      tips: ["Don't oversoak the noodles", "High heat is essential for authentic flavor"]
    },
    nutritionalInfo: {
      calories: 350,
      protein: "15g",
      carbs: "45g",
      fat: "12g"
    },
    tags: ["Street Food", "Noodles", "Spicy"],
    isPopular: true
  },
  {
    name: "Pizza Margherita",
    description: "Classic Italian pizza with tomato sauce, mozzarella, and fresh basil",
    cuisine: "Italian",
    location: {
      city: "Naples",
      country: "Italy",
      coordinates: { lat: 40.8518, lng: 14.2681 }
    },
    ingredients: ["Pizza dough", "Tomato sauce", "Mozzarella", "Fresh basil", "Olive oil", "Salt"],
    preparationTime: "45 minutes",
    difficulty: "Medium",
    servings: 2,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
    recipe: {
      instructions: [
        "Preheat oven to 500°F (260°C)",
        "Roll out pizza dough",
        "Spread tomato sauce evenly",
        "Add torn mozzarella pieces",
        "Bake for 10-12 minutes",
        "Top with fresh basil"
      ],
      tips: ["Use high-quality San Marzano tomatoes", "Don't overload with toppings"]
    },
    nutritionalInfo: {
      calories: 280,
      protein: "12g",
      carbs: "35g",
      fat: "10g"
    },
    tags: ["Pizza", "Vegetarian", "Classic"],
    isPopular: true
  },
  {
    name: "Tacos al Pastor",
    description: "Mexican street tacos with marinated pork, pineapple, and cilantro",
    cuisine: "Mexican",
    location: {
      city: "Mexico City",
      country: "Mexico",
      coordinates: { lat: 19.4326, lng: -99.1332 }
    },
    ingredients: ["Pork shoulder", "Corn tortillas", "Pineapple", "Onion", "Cilantro", "Achiote paste", "Orange juice"],
    preparationTime: "2 hours",
    difficulty: "Hard",
    servings: 6,
    image: "https://images.unsplash.com/photo-1565299585323-38174c4a6471?w=400",
    recipe: {
      instructions: [
        "Marinate pork in achiote paste overnight",
        "Cook on vertical trompo or grill",
        "Warm corn tortillas",
        "Slice pork thinly",
        "Top with pineapple, onion, and cilantro"
      ],
      tips: ["Marinate for at least 4 hours", "Char the pineapple for extra flavor"]
    },
    nutritionalInfo: {
      calories: 320,
      protein: "18g",
      carbs: "25g",
      fat: "16g"
    },
    tags: ["Street Food", "Pork", "Spicy"],
    isPopular: true
  },
  {
    name: "Sushi",
    description: "Traditional Japanese dish with vinegared rice and fresh fish",
    cuisine: "Japanese",
    location: {
      city: "Tokyo",
      country: "Japan",
      coordinates: { lat: 35.6762, lng: 139.6503 }
    },
    ingredients: ["Sushi rice", "Fresh fish", "Nori", "Wasabi", "Soy sauce", "Pickled ginger"],
    preparationTime: "1 hour",
    difficulty: "Hard",
    servings: 4,
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400",
    recipe: {
      instructions: [
        "Prepare sushi rice with vinegar seasoning",
        "Cut fish into precise pieces",
        "Form rice into small ovals",
        "Top with fish",
        "Serve with wasabi and soy sauce"
      ],
      tips: ["Use sushi-grade fish only", "Keep hands wet when handling rice"]
    },
    nutritionalInfo: {
      calories: 200,
      protein: "20g",
      carbs: "30g",
      fat: "2g"
    },
    tags: ["Raw Fish", "Rice", "Traditional"],
    isPopular: true
  },
  {
    name: "Croissant",
    description: "Buttery, flaky French pastry perfect for breakfast",
    cuisine: "French",
    location: {
      city: "Paris",
      country: "France",
      coordinates: { lat: 48.8566, lng: 2.3522 }
    },
    ingredients: ["Flour", "Butter", "Yeast", "Milk", "Sugar", "Salt", "Eggs"],
    preparationTime: "8 hours",
    difficulty: "Hard",
    servings: 8,
    image: "https://images.unsplash.com/photo-1555507036-ab794f4ade2a?w=400",
    recipe: {
      instructions: [
        "Make dough and chill overnight",
        "Laminate with butter in multiple folds",
        "Roll and shape into crescents",
        "Proof until doubled",
        "Bake until golden brown"
      ],
      tips: ["Keep butter and dough at same temperature", "Don't rush the lamination process"]
    },
    nutritionalInfo: {
      calories: 230,
      protein: "5g",
      carbs: "26g",
      fat: "12g"
    },
    tags: ["Pastry", "Breakfast", "Buttery"],
    isPopular: true
  }
];

console.log('Sample dishes data:');
console.log(JSON.stringify(sampleDishes, null, 2));