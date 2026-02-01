import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    users: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      required: [true, 'Chat must have users'],
      validate: {
        validator: function(users) {
          return users.length >= 2;
        },
        message: 'Chat must have at least 2 users'
      }
    },
    
    isGroup: {
      type: Boolean,
      required: true,
      default: false
    },
    
    // Group chat ONLY fields
    type: {
      type: String,
      enum: {
        values: ['movie', 'anime', 'episode', 'scene'],
        message: '{VALUE} is not a valid chat type'
      },
      default: null
    },
    
    title: {
      type: String,
      default: null,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    
    image: {
      type: String,
      default: null,
      trim: true
    },
    
    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    
    admin: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }],
    
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);


export default mongoose.model('Chat', chatSchema);