import express from 'express';
import Group from '../models/Group.js';

const router = express.Router();

// GET all groups for a user (as member or creator)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const groups = await Group.find({
      $or: [
        { createdBy: userId },
        { 'members.userId': userId }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single group by ID
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new group
router.post('/', async (req, res) => {
  try {
    const { groupName, createdBy, description, initialMembers } = req.body;

    if (!groupName || !createdBy) {
      return res.status(400).json({ message: 'groupName and createdBy are required' });
    }

    const members = initialMembers || [];
    
    const newGroup = new Group({
      groupName,
      createdBy,
      description,
      members,
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update group details
router.put('/:id', async (req, res) => {
  try {
    const { groupName, description } = req.body;
    
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      { groupName, description },
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST add member to group
router.post('/:id/members', async (req, res) => {
  try {
    const { userId, userName, email } = req.body;
    const groupId = req.params.id;

    if (!userId || !userName) {
      return res.status(400).json({ message: 'userId and userName are required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if member already exists
    const memberExists = group.members.some(m => m.userId === userId);
    if (memberExists) {
      return res.status(400).json({ message: 'Member already in group' });
    }

    group.members.push({ userId, userName, email });
    const updatedGroup = await group.save();

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE remove member from group
router.delete('/:groupId/members/:userId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    group.members = group.members.filter(m => m.userId !== req.params.userId);
    const updatedGroup = await group.save();

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE group
router.delete('/:id', async (req, res) => {
  try {
    const deletedGroup = await Group.findByIdAndDelete(req.params.id);
    if (!deletedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
