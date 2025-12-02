// Load events routes
try {
  const eventsRouter = (await import('./routes/events.js')).default;
  app.use('/api/events', eventsRouter);
  console.log('✅ Events routes loaded');
} catch (error) {
  console.error('❌ Failed to load events routes:', error);
}
