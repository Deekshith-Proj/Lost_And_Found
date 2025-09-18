const express = require('express');
const { body, validationResult } = require('express-validator');
const Issue = require('../models/Issue');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all issues with filters
// @route   GET /api/issues
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name email studentId')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('upvotes', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Issue.countDocuments(filter);

    res.json({
      issues,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email studentId phone')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('upvotes', 'name email');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private
router.post('/', protect, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').isIn(['infrastructure', 'electrical', 'plumbing', 'cleaning', 'security', 'internet', 'furniture', 'other']).withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('location').trim().isLength({ min: 3, max: 100 }).withMessage('Location must be between 3 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const issueData = {
      ...req.body,
      reportedBy: req.user._id
    };

    const issue = await Issue.create(issueData);
    const populatedIssue = await Issue.findById(issue._id)
      .populate('reportedBy', 'name email studentId');

    res.status(201).json(populatedIssue);
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update issue
// @route   PUT /api/issues/:id
// @access  Private
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').optional().isIn(['infrastructure', 'electrical', 'plumbing', 'cleaning', 'security', 'internet', 'furniture', 'other']).withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('location').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Location must be between 3 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check if user is the reporter or admin
    if (issue.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this issue' });
    }

    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email studentId')
     .populate('assignedTo', 'name email')
     .populate('resolvedBy', 'name email')
     .populate('upvotes', 'name email');

    res.json(updatedIssue);
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Upvote/Downvote issue
// @route   PUT /api/issues/:id/upvote
// @access  Private
router.put('/:id/upvote', protect, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const userId = req.user._id.toString();
    const isUpvoted = issue.upvotes.includes(userId);

    let updatedIssue;

    if (isUpvoted) {
      // Remove upvote
      updatedIssue = await Issue.findByIdAndUpdate(
        req.params.id,
        { $pull: { upvotes: userId } },
        { new: true, runValidators: true }
      );
    } else {
      // Add upvote
      updatedIssue = await Issue.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { upvotes: userId } },
        { new: true, runValidators: true }
      );
    }

    const populatedIssue = await Issue.findById(updatedIssue._id)
      .populate('reportedBy', 'name email studentId')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('upvotes', 'name email');

    res.json(populatedIssue);
  } catch (error) {
    console.error('Upvote issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Assign issue to admin/staff
// @route   PUT /api/issues/:id/assign
// @access  Private (Admin)
router.put('/:id/assign', protect, authorize('admin'), [
  body('assignedTo').isMongoId().withMessage('Please provide a valid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: req.body.assignedTo,
        status: 'in-progress'
      },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email studentId')
     .populate('assignedTo', 'name email')
     .populate('resolvedBy', 'name email')
     .populate('upvotes', 'name email');

    res.json(updatedIssue);
  } catch (error) {
    console.error('Assign issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update issue status
// @route   PUT /api/issues/:id/status
// @access  Private (Admin)
router.put('/:id/status', protect, authorize('admin'), [
  body('status').isIn(['pending', 'in-progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('resolutionNotes').optional().trim().isLength({ max: 500 }).withMessage('Resolution notes cannot be more than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const updateData = {
      status: req.body.status
    };

    if (req.body.status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user._id;
    }

    if (req.body.resolutionNotes) {
      updateData.resolutionNotes = req.body.resolutionNotes;
    }

    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email studentId')
     .populate('assignedTo', 'name email')
     .populate('resolvedBy', 'name email')
     .populate('upvotes', 'name email');

    res.json(updatedIssue);
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check if user is the reporter or admin
    if (issue.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this issue' });
    }

    await Issue.findByIdAndDelete(req.params.id);

    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
