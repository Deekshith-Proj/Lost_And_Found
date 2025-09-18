const express = require('express');
const { body, validationResult } = require('express-validator');
const LostFound = require('../models/LostFound');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all lost/found items with filters
// @route   GET /api/lost-found
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      type,
      status = 'active',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const items = await LostFound.find(filter)
      .populate('reportedBy', 'name email studentId')
      .populate('claimedBy', 'name email studentId')
      .populate('verifiedBy', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LostFound.countDocuments(filter);

    res.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get lost/found items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single lost/found item
// @route   GET /api/lost-found/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id)
      .populate('reportedBy', 'name email studentId phone')
      .populate('claimedBy', 'name email studentId')
      .populate('verifiedBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new lost/found item
// @route   POST /api/lost-found
// @access  Private
router.post('/', protect, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('category').isIn(['electronics', 'clothing', 'books', 'accessories', 'documents', 'keys', 'bags', 'other']).withMessage('Invalid category'),
  body('type').isIn(['lost', 'found']).withMessage('Type must be either lost or found'),
  body('location').trim().isLength({ min: 3, max: 100 }).withMessage('Location must be between 3 and 100 characters'),
  body('date').isISO8601().withMessage('Please provide a valid date'),
  body('images').isArray({ min: 1 }).withMessage('Please provide at least one image'),
  body('contactInfo.phone').matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  body('contactInfo.email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const itemData = {
      ...req.body,
      reportedBy: req.user._id
    };

    const item = await LostFound.create(itemData);
    const populatedItem = await LostFound.findById(item._id)
      .populate('reportedBy', 'name email studentId');

    res.status(201).json(populatedItem);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update lost/found item
// @route   PUT /api/lost-found/:id
// @access  Private
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('category').optional().isIn(['electronics', 'clothing', 'books', 'accessories', 'documents', 'keys', 'bags', 'other']).withMessage('Invalid category'),
  body('location').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Location must be between 3 and 100 characters'),
  body('contactInfo.phone').optional().matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  body('contactInfo.email').optional().isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the reporter or admin
    if (item.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    const updatedItem = await LostFound.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email studentId')
     .populate('claimedBy', 'name email studentId')
     .populate('verifiedBy', 'name email');

    res.json(updatedItem);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Claim lost/found item
// @route   PUT /api/lost-found/:id/claim
// @access  Private
router.put('/:id/claim', protect, async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status !== 'active') {
      return res.status(400).json({ message: 'Item is not available for claiming' });
    }

    // Check if user is trying to claim their own item
    if (item.reportedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot claim your own item' });
    }

    const updatedItem = await LostFound.findByIdAndUpdate(
      req.params.id,
      {
        status: 'claimed',
        claimedBy: req.user._id,
        claimedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email studentId')
     .populate('claimedBy', 'name email studentId')
     .populate('verifiedBy', 'name email');

    res.json(updatedItem);
  } catch (error) {
    console.error('Claim item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Verify lost/found item (Admin only)
// @route   PUT /api/lost-found/:id/verify
// @access  Private (Admin)
router.put('/:id/verify', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const updatedItem = await LostFound.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email studentId')
     .populate('claimedBy', 'name email studentId')
     .populate('verifiedBy', 'name email');

    res.json(updatedItem);
  } catch (error) {
    console.error('Verify item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Close lost/found item
// @route   PUT /api/lost-found/:id/close
// @access  Private
router.put('/:id/close', protect, async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the reporter or admin
    if (item.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to close this item' });
    }

    const updatedItem = await LostFound.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email studentId')
     .populate('claimedBy', 'name email studentId')
     .populate('verifiedBy', 'name email');

    res.json(updatedItem);
  } catch (error) {
    console.error('Close item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete lost/found item
// @route   DELETE /api/lost-found/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the reporter or admin
    if (item.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await LostFound.findByIdAndDelete(req.params.id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
