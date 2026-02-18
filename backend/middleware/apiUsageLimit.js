import UserApiUsage from '../models/UserApiUsage.js';

const DAILY_EXPLORE_LIMIT = 5;

export async function checkExploreLimit(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || 'anonymous';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Find or create usage record
    let usage = await UserApiUsage.findOne({ userId, date: today });
    
    if (!usage) {
      usage = new UserApiUsage({ userId, date: today, exploreRequests: 0 });
    }
    
    // Check limit
    if (usage.exploreRequests >= DAILY_EXPLORE_LIMIT) {
      return res.status(429).json({
        status: 'LIMIT_REACHED',
        message: `Daily limit of ${DAILY_EXPLORE_LIMIT} explore requests reached`,
        remaining: 0,
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      });
    }
    
    // Increment counter
    usage.exploreRequests += 1;
    usage.lastRequest = new Date();
    await usage.save();
    
    // Add usage info to request
    req.apiUsage = {
      used: usage.exploreRequests,
      remaining: DAILY_EXPLORE_LIMIT - usage.exploreRequests,
      limit: DAILY_EXPLORE_LIMIT
    };
    
    next();
  } catch (error) {
    console.error('❌ API usage check failed:', error);
    // Allow request on error
    next();
  }
}

export async function getUsageStats(req, res) {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || 'anonymous';
    const today = new Date().toISOString().split('T')[0];
    
    const usage = await UserApiUsage.findOne({ userId, date: today });
    
    const used = usage?.exploreRequests || 0;
    const remaining = DAILY_EXPLORE_LIMIT - used;
    
    res.json({
      status: 'OK',
      used,
      remaining,
      limit: DAILY_EXPLORE_LIMIT,
      resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
