import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // --- TYPE D'ALERTE ---
  type: {
    type: String,
    enum: [
      "TASK_STARTING", // Rappel quand la tâche commence
      "TASK_ENDING",   // Rappel quand la tâche approche de la fin
      "TASK_OVERDUE",  // Alerte si la tâche est en retard (échouée)
      "TASK_CREATED", 
      "TASK_UPDATED", 
      "TASK_DELETED", 
      "SYSTEM"
    ],
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
  // --- GESTION DE L'ENVOI ---
  read: {
    type: Boolean,
    default: false
  },
  scheduledFor: {
    type: Date,
    default: Date.now // Par défaut immédiat, mais peut être programmé dans le futur
  },
  sentStatus: {
    type: String,
    enum: ["PENDING", "SENT", "FAILED"],
    default: "SENT" // Les notifications classiques sont SENT immédiatement
  },
  // Pour savoir si on doit aussi envoyer un email
  sendEmail: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Indexation pour la performance
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ scheduledFor: 1, sentStatus: 1 }); // Crucial pour ton futur script d'envoi automatique

export default mongoose.model("Notification", notificationSchema);