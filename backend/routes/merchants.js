import express from 'express';
const router = express.Router();

// Mock merchant data
let merchants = [];
let deals = [];

// Merchant registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, businessName, businessType, address } = req.body;
    
    const merchant = {
      id: Date.now().toString(),
      email,
      businessName,
      businessType,
      address,
      verified: true,
      createdAt: new Date().toISOString()
    };
    
    merchants.push(merchant);
    res.status(201).json({ success: true, merchant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Merchant login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const merchant = merchants.find(m => m.email === email);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    
    res.json({ success: true, merchant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create deal
router.post('/:merchantId/deals', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const dealData = req.body;
    
    const deal = {
      id: Date.now().toString(),
      merchantId,
      ...dealData,
      views: 0,
      claims: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    deals.push(deal);
    res.status(201).json({ success: true, deal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get merchant deals
router.get('/:merchantId/deals', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const merchantDeals = deals.filter(d => d.merchantId === merchantId);
    res.json(merchantDeals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update deal
router.put('/deals/:dealId', async (req, res) => {
  try {
    const { dealId } = req.params;
    const updates = req.body;
    
    const dealIndex = deals.findIndex(d => d.id === dealId);
    if (dealIndex === -1) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    deals[dealIndex] = { ...deals[dealIndex], ...updates };
    res.json({ success: true, deal: deals[dealIndex] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active deals (for customer app)
router.get('/deals/active', async (req, res) => {
  try {
    const activeDeals = deals.filter(d => d.isActive);
    res.json(activeDeals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;