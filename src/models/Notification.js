import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["TASK_CREATED", "TASK_UPDATED", "TASK_DELETED", "SYSTEM"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task"
  },
  read: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index pour récupérer rapidement les notifications non lues d'un utilisateur
notificationSchema.index({ user: 1, read: 1 });

export default mongoose.model("Notification", notificationSchema);