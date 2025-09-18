const mongoose = require('mongoose');

const lostFoundSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'electronics',
      'clothing',
      'books',
      'accessories',
      'documents',
      'keys',
      'bags',
      'other'
    ]
  },
  type: {
    type: String,
    required: [true, 'Please specify if item is lost or found'],
    enum: ['lost', 'found']
  },
  location: {
    type: String,
    required: [true, 'Please provide the location'],
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Please provide the date']
  },
  images: [{
    type: String, // Cloudinary URLs
    required: [true, 'Please provide at least one image']
  }],
  status: {
    type: String,
    enum: ['active', 'claimed', 'closed'],
    default: 'active'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  },
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Please provide contact phone number']
    },
    email: {
      type: String,
      required: [true, 'Please provide contact email']
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better search performance
lostFoundSchema.index({ title: 'text', description: 'text', location: 'text' });
lostFoundSchema.index({ category: 1, type: 1, status: 1 });

module.exports = mongoose.model('LostFound', lostFoundSchema);
