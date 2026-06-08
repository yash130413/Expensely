import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  members: [
    {
      userId: {
        type: String,
        required: true,
      },
      userName: {
        type: String,
        required: true,
      },
      email: String,
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  description: {
    type: String,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true
});

const Group = mongoose.model('Group', groupSchema);

export default Group;
