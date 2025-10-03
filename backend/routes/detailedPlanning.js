import express from 'express';
const router = express.Router();

// Detailed places database for Azure deployment
const detailedPlacesDB = {
  'anuradhapura': [
    {
      name: 'Sri Maha Bodhi Tree',
      description: 'The sacred Bodhi tree, grown from a cutting of the original tree under which Buddha attained enlightenment',
      whyVisit: 'Witness 2,300 years of continuous worship at the world\'s oldest historically documented tree',
      bestTime: 'Early morning (6:00-8:00 AM) for peaceful atmosphere and golden light',
      duration: '45-60 minutes',
      cost: 'Free (donations welcome)',
      insiderTip: 'Bring white flowers as offerings - locals sell them at the entrance for Rs. 50',
      whatToExpect: 'Pilgrims chanting, incense burning, and a deeply spiritual atmosphere. Remove shoes and hats.',
      photoOps: ['Golden hour lighting through ancient branches', 'Pilgrims in prayer', 'Colorful prayer flags'],
      nearbyEats: ['Swarnamali Restaurant (authentic rice & curry)', 'Hotel Alakamanda (Western options)'],
      transportTip: 'Tuk-tuk from city center: Rs. 200-300, or rent bicycle for Rs. 500/day',
      crowdLevel: 'Busy during Poya days, peaceful on weekdays',
      weatherConsideration: 'Shade available, but bring water - can get very hot by 10 AM'
    },
    {
      name: 'Ruwanwelisaya Stupa',
      description: 'Magnificent white dome stupa built by King Dutugemunu in 140 BC, one of the tallest ancient structures',
      whyVisit: 'Marvel at ancient engineering - this 103m tall monument has survived 2,000+ years of earthquakes',
      bestTime: 'Sunset (5:30-6:30 PM) when the white dome glows golden',
      duration: '1-1.5 hours',
      cost: 'Free',
      insiderTip: 'Walk clockwise around the stupa 3 times for good luck - join locals in this ritual',
      whatToExpect: 'Massive scale will amaze you. Elephant statues guard the base. Peaceful circumambulation path.',
      photoOps: ['Dramatic sunset silhouettes', 'Intricate elephant carvings', 'Pilgrims with lotus flowers'],
      nearbyEats: ['Casserole Food City (local buffet)', 'Shanthi Restaurant (hoppers & kottu)'],
      transportTip: 'Walking distance from Bodhi Tree (10 mins), or tuk-tuk Rs. 150',
      crowdLevel: 'Moderate crowds, busiest at sunset',
      weatherConsideration: 'Open area - bring hat and sunscreen, beautiful in any weather'
    }
  ],
  'polonnaruwa': [
    {
      name: 'Gal Vihara Rock Temple',
      description: 'Four magnificent Buddha statues carved from a single granite rock face in the 12th century',
      whyVisit: 'Witness the pinnacle of ancient Sinhalese stone carving - these statues rival any in the world',
      bestTime: 'Early morning (7:00-9:00 AM) for soft light and fewer crowds',
      duration: '45 minutes',
      cost: 'Included in Polonnaruwa site ticket (USD $30)',
      insiderTip: 'The reclining Buddha\'s expression changes as you move - find the "sweet spot" for photos',
      whatToExpect: 'Jaw-dropping artistry. The 14m reclining Buddha will leave you speechless.',
      photoOps: ['Different angles of each statue', 'Intricate facial expressions', 'Scale shots with people'],
      nearbyEats: ['Gal Vihara Restaurant (rice & curry)', 'Priyamali Gedara (authentic village food)'],
      transportTip: 'Bicycle tour covers all sites efficiently - rent at entrance for Rs. 500',
      crowdLevel: 'Popular but spacious - morning visits less crowded',
      weatherConsideration: 'Covered pavilion protects statues and visitors from sun/rain'
    }
  ]
};

// Note: /generate-day endpoint is handled in server.js to use Azure OpenAI

// Generate detailed trip plan endpoint using Azure OpenAI
router.post('/generate-detailed', async (req, res) => {
  try {
    const { destination, duration, interests, pace, budget } = req.body;
    
    if (!destination || !duration) {
      return res.status(400).json({ error: 'Destination and duration are required' });
    }

    const days = parseInt(duration.match(/(\d+)/)?.[1] || '3');
    
    // Use Azure OpenAI to generate trip plan
    const prompt = `Create a detailed ${days}-day trip plan for ${destination}.
    Interests: ${interests || 'general sightseeing'}
    Pace: ${pace || 'moderate'}
    Budget: ${budget || 'moderate'}
    
    Return JSON: {
      "tripTitle": "${destination} ${duration} Adventure",
      "destination": "${destination}",
      "duration": "${duration}",
      "introduction": "Brief introduction",
      "dailyPlans": [
        {
          "day": 1,
          "title": "Day 1 Title",
          "activities": [
            {
              "timeOfDay": "09:00-11:00",
              "activityTitle": "Activity Name",
              "description": "Description"
            }
          ]
        }
      ],
      "conclusion": "Conclusion"
    }`;
    
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
      defaultQuery: { 'api-version': '2024-02-15-preview' },
      defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
    });
    
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const responseText = completion.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    let tripPlan;
    if (jsonMatch) {
      tripPlan = JSON.parse(jsonMatch[0]);
      tripPlan.id = `detailed_${Date.now()}`;
      tripPlan.totalEstimatedCost = 'USD $45-65 per day';
      tripPlan.estimatedWalkingDistance = `${days * 3.2} km total`;
      tripPlan.createdAt = new Date().toISOString();
      tripPlan.updatedAt = new Date().toISOString();
    } else {
      throw new Error('No valid JSON in AI response');
    }

    res.json({ tripPlan });
  } catch (error) {
    console.error('Detailed trip generation error:', error);
    res.status(500).json({ error: 'Failed to generate detailed trip plan' });
  }
});

function generateRichIntroduction(destination, interests, days) {
  const introductions = {
    'anuradhapura': `🏛️ **Welcome to Anuradhapura - Sri Lanka's Ancient Capital**

Prepare for a journey through 2,300 years of history! Anuradhapura isn't just another tourist destination - it's a living, breathing testament to human civilization.

**Your ${days}-Day Adventure Includes:**
✨ Sacred Bodhi Tree meditation experience
🏛️ Massive stupas that dwarf modern buildings
🌿 Hidden monastery ruins in jungle settings
📿 Authentic Buddhist rituals and ceremonies

This isn't just sightseeing - it's time travel.`,

    'polonnaruwa': `👑 **Discover Polonnaruwa - The Medieval Marvel**

Step into Sri Lanka's golden age! Polonnaruwa was the island's capital when it reached its cultural and architectural peak.

**Your ${days}-Day Journey Features:**
🗿 Gal Vihara's world-famous rock sculptures
🏰 Royal palace complex exploration
🌸 Lotus pond architectural marvels
🚴 Bicycle adventures through ancient streets

This is where history comes alive.`
  };

  const destinationKey = destination.toLowerCase().split(',')[0].trim();
  return introductions[destinationKey] || `Discover the wonders of ${destination} through this carefully crafted ${days}-day journey.`;
}

function generateDailyPlans(places, days, pace, destination) {
  const dailyPlans = [];
  const placesPerDay = Math.ceil(places.length / days);
  
  for (let day = 1; day <= days; day++) {
    const dayPlaces = places.slice((day - 1) * placesPerDay, day * placesPerDay);
    const activities = generateDetailedActivities(dayPlaces, pace);
    
    dailyPlans.push({
      day,
      title: `${destination} Heritage Discovery`,
      theme: 'Sacred Sites & Ancient Wonders',
      activities,
      dayEstimatedCost: 'USD $15-25',
      dayWalkingDistance: '3.2 km',
      date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      summary: `Explore ${dayPlaces.length} magnificent heritage sites with expert insights`,
      totalWalkingTime: '45 min',
      totalTravelTime: '1.5 hours',
      dailyRecap: `Discover ${dayPlaces.map(p => p.name).join(', ')} with insider knowledge`
    });
  }
  
  return dailyPlans;
}

function generateDetailedActivities(places, pace) {
  const timeSlots = {
    'relaxed': [
      {time: '08:30-10:00', start: '08:30', end: '10:00'},
      {time: '10:30-12:00', start: '10:30', end: '12:00'},
      {time: '14:00-15:30', start: '14:00', end: '15:30'}
    ],
    'moderate': [
      {time: '08:00-09:30', start: '08:00', end: '09:30'},
      {time: '10:00-11:30', start: '10:00', end: '11:30'},
      {time: '13:00-14:30', start: '13:00', end: '14:30'},
      {time: '15:00-16:30', start: '15:00', end: '16:30'}
    ],
    'fast-paced': [
      {time: '07:30-09:00', start: '07:30', end: '09:00'},
      {time: '09:30-11:00', start: '09:30', end: '11:00'},
      {time: '11:30-13:00', start: '11:30', end: '13:00'},
      {time: '14:00-15:30', start: '14:00', end: '15:30'},
      {time: '16:00-17:30', start: '16:00', end: '17:30'}
    ]
  };

  const slots = timeSlots[pace?.toLowerCase()] || timeSlots.moderate;
  const activities = [];

  places.forEach((place, index) => {
    if (index < slots.length) {
      const timeSlot = slots[index];
      activities.push({
        timeOfDay: timeSlot.time,
        activityTitle: place.name,
        description: generateRichDescription(place),
        estimatedDuration: place.duration,
        location: place.name,
        category: 'culture',
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        estimatedCost: place.cost,
        practicalTip: place.insiderTip,
        weatherNote: place.weatherConsideration,
        tags: ['Must-See', 'Photo Worthy', 'Historical'],
        travelMode: 'walking',
        travelTimeMin: 15,
        estimatedVisitDurationMin: parseInt(place.duration.match(/(\d+)/)?.[1] || '90')
      });
    }
  });

  return activities;
}

function generateRichDescription(place) {
  return `🏛️ **${place.name}**

**Why Visit:** ${place.whyVisit}

**What to Expect:** ${place.whatToExpect}

**Best Time:** ${place.bestTime}

**💡 Insider Tip:** ${place.insiderTip}

**📸 Photo Opportunities:**
${place.photoOps.map(op => `• ${op}`).join('\n')}

**🍽️ Nearby Food:**
${place.nearbyEats.map(eat => `• ${eat}`).join('\n')}

**🚗 Getting There:** ${place.transportTip}

**👥 Crowd Level:** ${place.crowdLevel}

**🌤️ Weather Note:** ${place.weatherConsideration}`;
}

function generateRichConclusion(destination, interests) {
  return `🌟 **Your ${destination} Adventure Awaits!**

This isn't just a trip plan - it's your gateway to experiences that will stay with you forever.

**Remember:**
• Respect local customs and dress modestly at religious sites
• Bring small bills for donations and local purchases  
• Stay hydrated and wear comfortable walking shoes

Safe travels, and prepare to be amazed! 🙏`;
}

export default router;