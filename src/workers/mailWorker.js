import cron from 'node-cron';
import Notification from '../models/Notification.js';
import Task from '../models/Task.js';
import { sendTaskEmail } from '../utils/mailer.js';

/**
 * WORKER : Vérifie et envoie les notifications programmées
 * Fréquence : Toutes les minutes (* * * * *)
 * Respecte le fuseau horaire Africa/Lagos (UTC+1) défini dans app.js
 */
const startMailWorker = () => {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    // Affichage de l'heure actuelle du scan pour débugger le fuseau horaire à Douala
    const localTime = now.toLocaleString('fr-FR', { timeZone: 'Africa/Lagos' });
    
    console.log(`🔍 [WORKER] Scan des notifications en attente... (Heure locale : ${localTime})`);

    try {
      // 1. Trouver les notifications PENDING arrivées à échéance (ou en retard)
      // On utilise $lte (Lower Than or Equal) pour attraper tout ce qui doit être envoyé maintenant ou avant
      const pendingNotifications = await Notification.find({
        sentStatus: "PENDING",
        scheduledFor: { $lte: now },
        sendEmail: true
      }).populate('user').populate('taskId');

      if (pendingNotifications.length === 0) {
        // Optionnel : console.log("ℹ️ [WORKER] Rien à envoyer pour le moment.");
        return;
      }

      console.log(`🚀 [WORKER] ${pendingNotifications.length} notification(s) à traiter.`);

      for (const notif of pendingNotifications) {
        try {
          // --- SÉCURITÉ 1 : Vérifier si l'utilisateur existe encore ---
          if (!notif.user || !notif.user.email) {
            console.log(`⚠️ [WORKER] Utilisateur introuvable pour la notif ${notif._id}`);
            notif.sentStatus = "FAILED";
            await notif.save();
            continue;
          }

          // --- SÉCURITÉ 2 : Ne pas envoyer si la tâche est déjà terminée ---
          if (notif.taskId && notif.taskId.status === "terminé") {
            console.log(`⏭️ [WORKER] Annulation de l'envoi pour "${notif.taskId.title}" (Déjà terminée)`);
            notif.sentStatus = "CANCELLED";
            await notif.save();
            continue;
          }

          // 2. Envoi de l'email via ton utilitaire Gmail
          // Note : on s'assure que le titre et le message existent
          const taskTitle = notif.taskId ? notif.taskId.title : "Mission TaskMaster";
          
          const emailSent = await sendTaskEmail(
            notif.user.email,
            notif.type,
            taskTitle,
            notif.message
          );

          if (emailSent) {
            notif.sentStatus = "SENT";
            console.log(`✅ [WORKER] Email [${notif.type}] envoyé avec succès à ${notif.user.email}`);

            // 🔥 LOGIQUE AUTO-EN COURS :
            // Si c'est une alerte de début, on met à jour la tâche automatiquement
            if (notif.type === "TASK_STARTING" && notif.taskId) {
              await Task.findByIdAndUpdate(notif.taskId._id, { status: "en cours" });
              console.log(`📈 [WORKER] Status Update : "${taskTitle}" est maintenant EN COURS.`);
            }
          } else {
            console.log(`❌ [WORKER] Échec d'envoi SMTP pour ${notif.user.email}`);
            notif.sentStatus = "FAILED";
          }
          
          await notif.save();

        } catch (err) {
          console.error(`❌ [WORKER] Erreur de traitement pour la notif ${notif._id}:`, err.message);
          notif.sentStatus = "FAILED";
          await notif.save();
        }
      }
    } catch (error) {
      console.error("🚨 [WORKER] Erreur critique lors du scan de la DB :", error.message);
    }
  });

  console.log("✅ [WORKER] Automate de mail activé (Fréquence : 1 minute)");
};

export default startMailWorker;