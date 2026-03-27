import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // 1. Récupération du header
  const authHeader = req.header("Authorization");

  // 2. Vérification du format "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Accès refusé. Format de token invalide (Bearer requis)." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 3. Vérification de la signature avec la clé secrète
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. On attache l'ID de l'utilisateur à la requête pour l'utiliser dans les tâches
    req.user = verified; 
    
    next();
  } catch (err) {
    // 5. Gestion spécifique de l'expiration
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expirée, veuillez vous reconnecter." });
    }
    res.status(403).json({ error: "Token non valide ou corrompu." });
  }
};