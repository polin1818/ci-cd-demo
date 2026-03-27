import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, "Le nom d'utilisateur est obligatoire"], 
    unique: true,
    trim: true,
    minlength: [3, "Le pseudo doit faire au moins 3 caractères"],
    maxlength: [20, "Le pseudo ne peut pas dépasser 20 caractères"]
  },
  email: {
    type: String,
    required: [true, "L'email est obligatoire"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Veuillez entrer un email valide"]
  },
  password: { 
    type: String, 
    required: [true, "Le mot de passe est obligatoire"],
    minlength: [6, "Le mot de passe doit faire au moins 6 caractères"],
    select: false 
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  }
}, { 
  timestamps: true 
});

// 🔥 CORRECTION ICI : On retire "next" et on utilise la logique async propre
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // On sort simplement si pas de modif

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // Pas besoin de next(), Mongoose gère la fin de la promesse
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);