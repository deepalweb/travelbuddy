// Platform detection middleware
const detectPlatform = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const platform = req.headers['x-platform'] || 
    (userAgent.includes('Mobile') ? 'mobile' : 'web');
  
  req.platform = platform;
  next();
};

module.exports = { detectPlatform };