# TravelBuddy Web App Redesign Plan

## Product direction

TravelBuddy should feel like one coherent product built around:

1. `Trip Planner`
2. `Community`
3. `Deals`
4. `Travel Services`

The primary truth of the web app is:

`Help users make better trip decisions with AI, community context, and practical travel tools.`

## Problems in the current web app

- Navigation and routing are mixed together in the layout layer.
- Public browsing is too restricted for discovery pages.
- The visual language changes from page to page.
- There are too many legacy flows competing with the main user journey.
- The homepage explains too many ideas at once instead of clearly leading users forward.

## New information architecture

### Top-level navigation

- `Home`
- `Trip Planner`
- `Community`
- `Services`

### Services dropdown

- `Deals`
- `Events`
- `Transport Hub`
- `Travel Agents`

## UI/UX principles

### Visual system

- Strong editorial headings
- Softer warm base background
- Dark navy shell with sky and orange accents
- Large rounded cards with cleaner spacing
- Fewer competing gradients

### Product behavior

- Let guests browse core discovery pages
- Keep the primary action obvious on every major page
- Make AI features feel useful, not magical or vague
- Remove dead routes and duplicate flows over time

## Redesign implementation order

### Phase 1

- Global design tokens
- Header redesign
- Footer redesign
- Homepage redesign
- Public route cleanup for marketing pages

### Phase 2

- Trip Planner redesign
- Cleaner trip generation form
- Better draft/save/open flow
- Trip detail page redesign

### Phase 3

- Community page redesign
- Deals page redesign
- Services pages redesign

### Phase 4

- Profile and settings redesign
- Route cleanup
- Remove obsolete components and navigation leftovers

## Current implementation status

Completed in this pass:

- New app shell styling foundation
- Redesigned main header
- Redesigned footer
- Redesigned homepage
- Public access restored for key browse pages

Next best step:

`Redesign the Trip Planner and Trip Detail experience using the new shell and visual system.`
