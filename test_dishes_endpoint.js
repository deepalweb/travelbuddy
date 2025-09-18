// Simple test for dishes endpoint
import fetch from 'node-fetch';

const testDishesEndpoint = async () => {
  const testData = {
    latitude: 6.9271,
    longitude: 79.8612,
    filters: {
      dietary: ['vegetarian'],
      budget: 'mid-range'
    }
  };

  try {
    console.log('🧪 Testing dishes endpoint...');
    console.log('📍 Location: Colombo, Sri Lanka');
    console.log('🔍 Filters:', testData.filters);
    
    const response = await fetch('http://localhost:3000/api/dishes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('\n✅ Success! Dishes generated:');
    console.log('📍 Location:', data.location);
    console.log('🍽️ Dishes found:', data.dishes?.length || 0);
    
    if (data.dishes && data.dishes.length > 0) {
      data.dishes.forEach((dish, index) => {
        console.log(`\n${index + 1}. ${dish.name}`);
        console.log(`   💰 Price: ${dish.average_price}`);
        console.log(`   🏷️ Category: ${dish.category}`);
        console.log(`   📝 Description: ${dish.description}`);
        if (dish.recommended_places && dish.recommended_places.length > 0) {
          console.log(`   🏪 Restaurant: ${dish.recommended_places[0].name}`);
        }
      });
    }
    
    console.log('\n📊 Metadata:');
    console.log('   Sources:', data.metadata?.source);
    console.log('   Filters applied:', data.metadata?.filters_applied);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testDishesEndpoint();