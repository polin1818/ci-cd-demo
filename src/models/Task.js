import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  // --- LIEN AVEC L'UTILISATEUR (INDISPENSABLE) ---
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Doit correspondre au nom de ton modèle User
    required: true
  },
  // ----------------------------------------------
  title: {
    type: String,
    required: [true, "Le titre est obligatoire"],
    trim: true,
    maxlength: [100, "Le titre ne peut pas dépasser 100 caractères"]
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  status: {
    type: String,
    enum: ["à faire", "en cours", "terminé"],
    default: "à faire"
  },
  priority: {
    type: String,
    enum: ["basse", "moyenne", "haute"],
    default: "moyenne"
  },
  dueDate: {
    type: Date,
  },
  category: {
    type: String,
    default: "Personnel",
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Indexation combinée : on cherche souvent par utilisateur ET par statut
taskSchema.index({ user: 1, status: 1 });

export default mongoose.model("Task", taskSchema);