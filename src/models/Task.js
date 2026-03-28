import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  // --- LIEN AVEC L'UTILISATEUR ---
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true
  },
  // --- INFORMATIONS DE LA MISSION ---
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
  // --- STATUTS ÉVOLUÉS ---
  status: {
    type: String,
    enum: ["à faire", "en cours", "terminé", "reprogrammé", "échoué"],
    default: "à faire"
  },
  priority: {
    type: String,
    enum: ["basse", "moyenne", "haute"],
    default: "moyenne"
  },
  category: {
    type: String,
    default: "Personnel",
    trim: true
  },

  // --- PRÉCISION TEMPORELLE (TIME MANAGEMENT) ---
  startDate: {
    type: Date,
    required: [true, "La date et l'heure de début sont obligatoires"]
  },
  endDate: {
    type: Date,
    required: [true, "La date et l'heure de fin sont obligatoires"]
  },

  // --- LOGIQUE DE REPROGRAMMATION ---
  wasRescheduled: {
    type: Boolean,
    default: false
  },
  parentTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    default: null
  },

  completed: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// --- INDEXATION ---
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ startDate: 1, endDate: 1 });

// --- MIDDLEWARE DE SÉCURITÉ (Syntaxe Moderne sans 'next') ---
taskSchema.pre('save', async function() {
  console.log("🛠️  [Middleware] Tentative de sauvegarde de la tâche...");

  // 1. Vérification de la cohérence des dates
  if (this.startDate >= this.endDate) {
    console.error("❌ [Middleware] Erreur : Dates incohérentes");
    throw new Error("L'heure de fin doit être strictement après l'heure de début.");
  }
  
  // 2. Mise à jour auto du statut booléen
  this.completed = (this.status === "terminé");
  
  console.log("✅ [Middleware] Validation réussie pour :", this.title);
});

export default mongoose.model("Task", taskSchema);