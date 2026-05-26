# Trip Planning Route Map

The web app is now structured as an AI Trip Planning Studio rather than a place-directory experience.

## Core routes

- `/discovery`
  - Generate trip ideas
  - Explore AI planning prompts
  - Select suggested stops to seed a trip draft

- `/compare`
  - Compare destinations, trip directions, and traveler-fit tradeoffs
  - Best for "Kandy vs Ella" style decisions

- `/trips`
  - Main trip planning workspace
  - Generate AI itineraries or build manually
  - Review existing trip drafts

- `/prepare`
  - Preparation workspace
  - Packing, booking order, etiquette, and backup-plan framing

- `/saved-plans`
  - Saved planning workspace
  - Intended home for AI-organized themes such as food, culture, nature, and must-do vs optional

- `/assistant`
  - Planning assistant surface
  - Conversational refinement, prioritization, and trip decision support

## Legacy compatibility

- `/places`
  - Redirected in-product to the idea studio behavior through the discovery page

- `/places/:id`
  - Existing detail route remains available, but should eventually be refactored into an AI stop brief experience

## Product stance

These routes are optimized for:

- idea generation
- itinerary structuring
- destination comparison
- trip refinement
- preparation support
- saved-plan organization

They are not positioned as a source of verified real-time place facts, official imagery, or exact business details.
