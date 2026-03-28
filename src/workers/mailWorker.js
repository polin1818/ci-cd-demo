import cron from 'node-cron';
import Notification from '../models/Notification.js';
import Task from '../models/Task.js';
import { sendTaskEmail } from '../utils/mailer.js';

/**
 * WORKER : Vérifie et envoie les notifications programmées
 * Fréquence : Toutes les minutes (* * * * *)
 */
const startMailWorker = () => {
  cron.schedule('* * * * *', async () => {
    console.log("🔍 [WORKER] Scan des notifications en attente...");

    try {
      const now = new Date();

      // 1. Trouver les notifications PENDING arrivées à échéance
      const pendingNotifications = await Notification.find({
        sentStatus: "PENDING",
        scheduledFor: { $lte: now },
        sendEmail: true
      }).populate('user').populate('taskId');

      if (pendingNotifications.length === 0) return;

      console.log(`🚀 [WORKER] ${pendingNotifications.length} notification(s) à traiter.`);

      for (const notif of pendingNotifications) {
        try {
          // --- SÉCURITÉ : Ne pas envoyer si la tâche est déjà terminée ---
          if (notif.taskId && notif.taskId.status === "terminé") {
            console.log(`⏭️ [WORKER] Saut de l'envoi pour "${notif.taskId.title}" (Déjà terminée)`);
            notif.sentStatus = "CANCELLED";
            await notif.save();
            continue;
          }

          // 2. Envoi de l'email via ton utilitaire Gmail
          const emailSent = await sendTaskEmail(
            notif.user.email,
            notif.type,
            notif.taskId ? notif.taskId.title : "Mission",
            notif.message
          );

          if (emailSent) {
            notif.sentStatus = "SENT";
            console.log(`📧 [WORKER] Email [${notif.type}] envoyé à ${notif.user.email}`);

            // 🔥 LOGIQUE AUTO-EN COURS :
            // Si c'est un rappel de début, on bascule la tâche sur "en cours"
            if (notif.type === "TASK_STARTING" && notif.taskId) {
              await Task.findByIdAndUpdate(notif.taskId._id, { status: "en cours" });
              console.log(`🚀 [WORKER] Tâche "${notif.taskId.title}" passée en statut EN COURS.`);
            }
          } else {
            notif.sentStatus = "FAILED";
          }
          
          await notif.save();

        } catch (err) {
          console.error(`❌ [WORKER] Échec pour la notif ${notif._id}:`, err.message);
          notif.sentStatus = "FAILED";
          await notif.save();
        }
      }
    } catch (error) {
      console.error("🚨 [WORKER] Erreur critique du scan :", error.message);
    }
  });

  console.log("✅ [WORKER] Automate de mail activé (Scan : 1 min)");
};

export default startMailWorker;