import { TripPlanSuggestion, DailyTripPlan, ActivityDetail } from '../types';

interface DetailedPlace {
  name: string;
  description: string;
  whyVisit: string;
  bestTime: string;
  duration: string;
  cost: string;
  insiderTip: string;
  whatToExpect: string;
  photoOps: string[];
  nearbyEats: string[];
  transportTip: string;
  crowdLevel: string;
  weatherConsideration: string;
}

export class DetailedTripPlanningService {
  private static instance: DetailedTripPlanningService;

  static getInstance(): DetailedTripPlanningService {
    if (!DetailedTripPlanningService.instance) {
      DetailedTripPlanningService.instance = new DetailedTripPlanningService();
    }
    return DetailedTripPlanningService.instance;
  }

  async generateDetailedTripPlan(params: {
    destination: string;
    duration: string;
    interests: string;
    pace: string;
    budget: string;
  }): Promise<TripPlanSuggestion> {
    try {
      // Try Azure backend first
      const { withApiBase } = await import('./config');
      const response = await fetch(withApiBase('/api/plans/generate-detailed'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (response.ok) {
        const data = await response.json();
        return data.tripPlan;
      }
    } catch (error) {
      console.warn('Azure backend failed, using local generation:', error);
    }

    // Fallback to local generation
    const { destination, duration, interests, pace, budget } = params;
    const days = this.extractDays(duration);
    
    const detailedPlaces = this.getDetailedPlaces(destination, interests, budget);
    const dailyPlans = this.generateRichDailyPlans(detailedPlaces, days, pace, destination);
    
    return {
      id: `detailed_${Date.now()}`,
      tripTitle: `${destination} ${duration} Discovery: ${this.getTripTheme(interests)}`,
      destination,
      duration,
      introduction: this.generateRichIntroduction(destination, interests, days),
      dailyPlans,
      conclusion: this.generateRichConclusion(destination, interests),
      totalEstimatedCost: this.calculateDetailedCost(dailyPlans),
      estimatedWalkingDistance: this.calculateWalkingDistance(dailyPlans),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private getDetailedPlaces(destination: string, interests: string, budget: string): DetailedPlace[] {
    // Rich database of detailed places - this would be expanded significantly
    const placeDatabase: Record<string, DetailedPlace[]> = {
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
          whatToExpected: 'Massive scale will amaze you. Elephant statues guard the base. Peaceful circumambulation path.',
          photoOps: ['Dramatic sunset silhouettes', 'Intricate elephant carvings', 'Pilgrims with lotus flowers'],
          nearbyEats: ['Casserole Food City (local buffet)', 'Shanthi Restaurant (hoppers & kottu)'],
          transportTip: 'Walking distance from Bodhi Tree (10 mins), or tuk-tuk Rs. 150',
          crowdLevel: 'Moderate crowds, busiest at sunset',
          weatherConsideration: 'Open area - bring hat and sunscreen, beautiful in any weather'
        },
        {
          name: 'Abhayagiri Monastery Complex',
          description: 'Vast ancient monastery ruins spanning 200 hectares, once home to 5,000 monks',
          whyVisit: 'Explore Sri Lanka\'s largest monastery complex with hidden caves, ancient pools, and forest paths',
          bestTime: 'Late afternoon (3:00-5:00 PM) for cooler exploration and dramatic lighting',
          duration: '2-3 hours (can easily spend half day)',
          cost: 'Rs. 500 entrance fee',
          insiderTip: 'Hire local guide Sunil (ask at entrance) for Rs. 1,500 - he knows secret spots and stories',
          whatToExpect: 'Jungle adventure meets archaeology. Wear good shoes - lots of walking on uneven paths.',
          photoOps: ['Moonstone carvings', 'Ancient bathing pools', 'Monastery ruins through jungle'],
          nearbyEats: ['Pack snacks - limited options nearby', 'Tissawewa Rest House (20 min drive)'],
          transportTip: 'Rent bicycle with guide for Rs. 800/day - best way to cover the vast area',
          crowdLevel: 'Less crowded than main sites - perfect for peaceful exploration',
          weatherConsideration: 'Jungle canopy provides shade, but paths can be muddy after rain'
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

    const destinationKey = destination.toLowerCase().split(',')[0].trim();
    let places = placeDatabase[destinationKey] || [];
    
    // Filter by interests
    if (interests.includes('culture') || interests.includes('history')) {
      // Keep all cultural/historical places
    } else if (interests.includes('nature')) {
      places = places.filter(p => p.description.includes('forest') || p.description.includes('nature'));
    }
    
    return places;
  }

  private generateRichDailyPlans(places: DetailedPlace[], days: number, pace: string, destination: string): DailyTripPlan[] {
    const dailyPlans: DailyTripPlan[] = [];
    const placesPerDay = Math.ceil(places.length / days);
    
    for (let day = 1; day <= days; day++) {
      const dayPlaces = places.slice((day - 1) * placesPerDay, day * placesPerDay);
      const activities = this.generateDetailedActivities(dayPlaces, day, pace);
      
      dailyPlans.push({
        day,
        title: `${destination} Heritage Discovery`,
        theme: this.getDayTheme(dayPlaces),
        activities,
        dayEstimatedCost: this.calculateDayCost(activities),
        dayWalkingDistance: '3.2 km',
        date: this.getDateString(day),
        summary: this.generateDaySummary(dayPlaces),
        totalWalkingTime: '45 min',
        totalTravelTime: '1.5 hours',
        dailyRecap: this.generateDayRecap(dayPlaces)
      });
    }
    
    return dailyPlans;
  }

  private generateDetailedActivities(places: DetailedPlace[], day: number, pace: string): ActivityDetail[] {
    const activities: ActivityDetail[] = [];
    const timeSlots = this.getTimeSlots(pace);
    
    places.forEach((place, index) => {
      if (index < timeSlots.length) {
        const timeSlot = timeSlots[index];
        activities.push({
          timeOfDay: timeSlot.time,
          activityTitle: place.name,
          description: this.generateRichDescription(place),
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
          estimatedVisitDurationMin: this.parseDuration(place.duration)
        });
      }
    });
    
    return activities;
  }

  private generateRichDescription(place: DetailedPlace): string {
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

  private generateRichIntroduction(destination: string, interests: string, days: number): string {
    const introductions: Record<string, string> = {
      'anuradhapura': `🏛️ **Welcome to Anuradhapura - Sri Lanka's Ancient Capital**

Prepare for a journey through 2,300 years of history! Anuradhapura isn't just another tourist destination - it's a living, breathing testament to human civilization. You'll walk where kings once ruled, meditate where Buddha's disciples found enlightenment, and witness engineering marvels that still baffle modern architects.

**What Makes This Special:**
• Home to the world's oldest historically documented tree
• Ancient irrigation systems that still function today  
• Sacred sites where millions of pilgrims have found peace
• Archaeological wonders spanning 40 square kilometers

**Your ${days}-Day Adventure Includes:**
✨ Sacred Bodhi Tree meditation experience
🏛️ Massive stupas that dwarf modern buildings
🌿 Hidden monastery ruins in jungle settings
📿 Authentic Buddhist rituals and ceremonies
🍛 Traditional village cuisine experiences

This isn't just sightseeing - it's time travel. Every stone has a story, every temple holds secrets, and every moment offers a chance to connect with something greater than yourself.`,

      'polonnaruwa': `👑 **Discover Polonnaruwa - The Medieval Marvel**

Step into Sri Lanka's golden age! Polonnaruwa was the island's capital when it reached its cultural and architectural peak. Here, ancient kings built monuments that still inspire awe, and master craftsmen created art that rivals the world's greatest masterpieces.

**Why Polonnaruwa Will Amaze You:**
• Rock-carved Buddha statues that seem alive
• Palace ruins of legendary King Parakramabahu
• Ancient hospitals with sophisticated drainage systems
• Lotus-shaped bathing pools fit for royalty

**Your ${days}-Day Journey Features:**
🗿 Gal Vihara's world-famous rock sculptures
🏰 Royal palace complex exploration
🌸 Lotus pond architectural marvels
🚴 Bicycle adventures through ancient streets
🦅 Wildlife spotting in Parakrama Samudra

This is where history comes alive. You'll touch stones carved by master craftsmen 800 years ago, walk through royal gardens, and understand why this UNESCO World Heritage site is considered one of Asia's greatest archaeological treasures.`
    };

    const destinationKey = destination.toLowerCase().split(',')[0].trim();
    return introductions[destinationKey] || `Discover the wonders of ${destination} through this carefully crafted ${days}-day journey.`;
  }

  private generateRichConclusion(destination: string, interests: string): string {
    return `🌟 **Your ${destination} Adventure Awaits!**

This isn't just a trip plan - it's your gateway to experiences that will stay with you forever. Every recommendation has been carefully chosen to give you authentic, meaningful encounters with ${destination}'s incredible heritage.

**Remember:**
• Respect local customs and dress modestly at religious sites
• Bring small bills for donations and local purchases  
• Stay hydrated and wear comfortable walking shoes
• Keep an open mind and heart - the best experiences often come unexpectedly

**Pro Tip:** Download offline maps and learn a few Sinhala phrases - locals appreciate the effort and you'll get even warmer welcomes!

Safe travels, and prepare to be amazed! 🙏`;
  }

  private getTimeSlots(pace: string): Array<{time: string, start: string, end: string}> {
    const slots = {
      'relaxed': [
        {time: '08:30-10:00', start: '08:30', end: '10:00'},
        {time: '10:30-12:00', start: '10:30', end: '12:00'},
        {time: '14:00-15:30', start: '14:00', end: '15:30'},
        {time: '16:00-17:30', start: '16:00', end: '17:30'}
      ],
      'moderate': [
        {time: '08:00-09:30', start: '08:00', end: '09:30'},
        {time: '10:00-11:30', start: '10:00', end: '11:30'},
        {time: '13:00-14:30', start: '13:00', end: '14:30'},
        {time: '15:00-16:30', start: '15:00', end: '16:30'},
        {time: '17:00-18:30', start: '17:00', end: '18:30'}
      ],
      'fast-paced': [
        {time: '07:30-09:00', start: '07:30', end: '09:00'},
        {time: '09:30-11:00', start: '09:30', end: '11:00'},
        {time: '11:30-13:00', start: '11:30', end: '13:00'},
        {time: '14:00-15:30', start: '14:00', end: '15:30'},
        {time: '16:00-17:30', start: '16:00', end: '17:30'},
        {time: '18:00-19:30', start: '18:00', end: '19:30'}
      ]
    };
    
    return slots[pace.toLowerCase() as keyof typeof slots] || slots.moderate;
  }

  private extractDays(duration: string): number {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 3;
  }

  private getTripTheme(interests: string): string {
    if (interests.includes('culture')) return 'Cultural Heritage Journey';
    if (interests.includes('history')) return 'Historical Discovery';
    if (interests.includes('spiritual')) return 'Spiritual Awakening';
    return 'Ancient Wonders Exploration';
  }

  private getDayTheme(places: DetailedPlace[]): string {
    return 'Sacred Sites & Ancient Wonders';
  }

  private calculateDetailedCost(dailyPlans: DailyTripPlan[]): string {
    return 'USD $45-65 per day';
  }

  private calculateWalkingDistance(dailyPlans: DailyTripPlan[]): string {
    return `${dailyPlans.length * 3.2} km total`;
  }

  private calculateDayCost(activities: ActivityDetail[]): string {
    return 'USD $15-25';
  }

  private getDateString(day: number): string {
    const date = new Date();
    date.setDate(date.getDate() + day - 1);
    return date.toLocaleDateString();
  }

  private generateDaySummary(places: DetailedPlace[]): string {
    return `Explore ${places.length} magnificent heritage sites with expert insights and insider tips`;
  }

  private generateDayRecap(places: DetailedPlace[]): string {
    return `Today you'll discover ${places.map(p => p.name).join(', ')} - each offering unique insights into Sri Lanka's incredible ancient civilization.`;
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) * 60 : 90; // Convert to minutes
  }
}

export const detailedTripPlanningService = DetailedTripPlanningService.getInstance();