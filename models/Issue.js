const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
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
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'infrastructure',
      'electrical',
      'plumbing',
      'cleaning',
      'security',
      'internet',
      'furniture',
      'other'
    ]
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  location: {
    type: String,
    required: [true, 'Please provide the location'],
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  images: [{
    type: String // Cloudinary URLs
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  upvoteCount: {
    type: Number,
    default: 0
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolutionNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Resolution notes cannot be more than 500 characters']
  },
  estimatedResolutionTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better search performance
issueSchema.index({ title: 'text', description: 'text', location: 'text' });
issueSchema.index({ category: 1, status: 1, priority: 1 });

// Update upvote count when upvotes array changes
issueSchema.pre('save', function(next) {
  this.upvoteCount = this.upvotes.length;
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
