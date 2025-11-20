import express from 'express'

const router = express.Router()

// Demo login endpoint
router.post('/demo-login', async (req, res) => {
  try {
    const demoUser = {
      id: 'demo-user-123',
      email: 'demo@travelbuddy.com',
      username: 'Demo User',
      tier: 'premium',
      role: 'admin',
      isAdmin: true
    }
    
    const demoToken = 'demo-token-' + Date.now()
    
    res.json({
      success: true,
      user: demoUser,
      token: demoToken
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Verify demo token
router.get('/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (token && token.startsWith('demo-token-')) {
      const demoUser = {
        id: 'demo-user-123',
        email: 'demo@travelbuddy.com',
        username: 'Demo User',
        tier: 'premium',
        role: 'admin',
        isAdmin: true
      }
      
      res.json({
        success: true,
        user: demoUser
      })
    } else {
      res.status(401).json({ error: 'Invalid token' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router