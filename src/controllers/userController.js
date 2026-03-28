import User from "../models/User.js";
import bcrypt from "bcryptjs";

// 1. Récupérer le profil de l'utilisateur connecté
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(403).json({ error: "Token non valide ou ID manquant dans le payload." });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 2. Modifier les informations de base (Nom, Email)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { name, email } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.name = name || user.name;
    user.email = email || user.email;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Cet email est déjà utilisé par un autre compte." });
    }
    res.status(400).json({ message: "Données invalides ou erreur lors de la mise à jour." });
  }
};

// 3. Modifier le mot de passe
export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "L'ancien et le nouveau mot de passe sont requis." });
    }

    // ✅ .select("+password") obligatoire car le champ a select:false dans le modèle
    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "L'ancien mot de passe est incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({ message: "Mot de passe mis à jour avec succès !" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du mot de passe." });
  }
};