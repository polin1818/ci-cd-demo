import User from "../models/User.js";
import jwt from "jsonwebtoken";

// 1. INSCRIPTION (Register)
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ error: "L'utilisateur ou l'email existe déjà" });
    }

    // Créer l'utilisateur (le mot de passe sera haché automatiquement par le modèle)
    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ message: "Utilisateur créé avec succès !" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 2. CONNEXION (Login)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Chercher l'utilisateur et inclure le mot de passe (car on a mis select: false dans le modèle)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    // 2. Vérifier le mot de passe grâce à la méthode qu'on a ajoutée au modèle
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    // 3. Générer le Token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // Le token expire après 24 heures
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
};