import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    // On compte aussi combien sont non lues
    const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });

    res.json({
      unreadCount,
      notifications
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: "Toutes les notifications sont marquées comme lues" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
};