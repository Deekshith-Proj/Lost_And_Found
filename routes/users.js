const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const LostFound = require('../models/LostFound');
const Issue = require('../models/Issue');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private (Admin)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private (Admin)
router.put('/:id/role', protect, authorize('admin'), [
  body('role').isIn(['student', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Toggle user active status (Admin only)
// @route   PUT /api/users/:id/toggle-active
// @access  Private (Admin)
router.put('/:id/toggle-active', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: !user.isActive },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Toggle user active status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats/overview
// @access  Private (Admin)
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      activeUsers,
      totalLostFound,
      activeLostFound,
      claimedLostFound,
      totalIssues,
      pendingIssues,
      resolvedIssues
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: true }),
      LostFound.countDocuments(),
      LostFound.countDocuments({ status: 'active' }),
      LostFound.countDocuments({ status: 'claimed' }),
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'pending' }),
      Issue.countDocuments({ status: 'resolved' })
    ]);

    res.json({
      users: {
        total: totalUsers,
        students: totalStudents,
        admins: totalAdmins,
        active: activeUsers
      },
      lostFound: {
        total: totalLostFound,
        active: activeLostFound,
        claimed: claimedLostFound
      },
      issues: {
        total: totalIssues,
        pending: pendingIssues,
        resolved: resolvedIssues
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user activity (Admin only)
// @route   GET /api/users/:id/activity
// @access  Private (Admin)
router.get('/:id/activity', protect, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    const [lostFoundItems, reportedIssues, claimedItems, upvotedIssues] = await Promise.all([
      LostFound.find({ reportedBy: userId }).sort({ createdAt: -1 }).limit(10),
      Issue.find({ reportedBy: userId }).sort({ createdAt: -1 }).limit(10),
      LostFound.find({ claimedBy: userId }).sort({ claimedAt: -1 }).limit(10),
      Issue.find({ upvotes: userId }).sort({ createdAt: -1 }).limit(10)
    ]);

    res.json({
      lostFoundItems,
      reportedIssues,
      claimedItems,
      upvotedIssues
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
