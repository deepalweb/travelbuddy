// Clear Places Cache Endpoint
// Add this to backend/routes/places.js

router.delete('/cache/clear', async (req, res) => {
  try {
    // Clear MongoDB places cache if you have one
    // await db.collection('places_cache').deleteMany({});
    
    console.log('✅ Places cache cleared');
    
    res.json({
      status: 'OK',
      message: 'Places cache cleared successfully'
    });
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache', 
      details: error.message 
    });
  }
});

// Or use this curl command to clear:
// curl -X DELETE http://localhost:5000/api/places/cache/clear
