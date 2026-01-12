const mongoose = require('mongoose');

const placesCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  data: {
    type: Object,
    required: true
  },
  hits: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours TTL (auto-delete)
  }
});

// Index for faster lookups
placesCacheSchema.index({ key: 1, createdAt: -1 });

module.exports = mongoose.model('PlacesCache', placesCacheSchema);
