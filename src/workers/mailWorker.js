import cron from 'node-cron';
import Notification from '../models/Notification.js';
import Task from '../models/Task.js';
import { sendTaskEmail } from '../utils/mailer.js';

const startMailWorker = () => {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const localTime = now.toLocaleString('fr-FR', { timeZone: 'Africa/Lagos' });
    
    console.log(`🔍 [WORKER] Scan des notifications en attente... (Heure locale : ${localTime})`);

    try {
      const pendingNotifications = await Notification.find({
        sentStatus: "PENDING",
        scheduledFor: { $lte: now },
        sendEmail: true
      }).populate('user').populate('taskId');

      if (pendingNotifications.length === 0) {
        console.log(`ℹ️ [WORKER] Aucune notification à envoyer.`);
        return;
      }

      console.log(`🚀 [WORKER] ${pendingNotifications.length} notification(s) à traiter.`);

      for (const notif of pendingNotifications) {
        console.log(`\n📋 [WORKER] Traitement notif ${notif._id} | type: ${notif.type} | scheduledFor: ${notif.scheduledFor}`);

        try {
          // SÉCURITÉ 1 : Utilisateur introuvable
          if (!notif.user || !notif.user.email) {
            console.warn(`⚠️ [WORKER] Utilisateur introuvable ou sans email pour la notif ${notif._id}`);
            notif.sentStatus = "FAILED";
            await notif.save();
            continue;
          }
          console.log(`👤 [WORKER] Destinataire : ${notif.user.email}`);

          // SÉCURITÉ 2 : Tâche déjà terminée
          if (notif.taskId && notif.taskId.status === "terminé") {
            console.log(`⏭️ [WORKER] Tâche "${notif.taskId.title}" déjà terminée — envoi annulé.`);
            notif.sentStatus = "CANCELLED";
            await notif.save();
            continue;
          }

          const taskTitle = notif.taskId ? notif.taskId.title : "Mission TaskMaster";
          console.log(`📌 [WORKER] Tâche concernée : "${taskTitle}" | status: ${notif.taskId?.status ?? 'N/A'}`);
          console.log(`📤 [WORKER] Appel sendTaskEmail → type: ${notif.type}, destinataire: ${notif.user.email}`);

          let emailSent = false;
          try {
            emailSent = await sendTaskEmail(
              notif.user.email,
              notif.type,
              taskTitle,
              notif.message
            );
            console.log(`📧 [WORKER] Résultat sendTaskEmail : ${emailSent}`);
          } catch (mailErr) {
            console.error(`💥 [WORKER] Exception dans sendTaskEmail :`, mailErr.message);
            console.error(mailErr.stack);
          }

          if (emailSent) {
            notif.sentStatus = "SENT";
            console.log(`✅ [WORKER] Email [${notif.type}] envoyé avec succès à ${notif.user.email}`);

            if (notif.type === "TASK_STARTING" && notif.taskId) {
              await Task.findByIdAndUpdate(notif.taskId._id, { status: "en cours" });
              console.log(`📈 [WORKER] Status Update : "${taskTitle}" → EN COURS`);
            }
          } else {
            console.error(`❌ [WORKER] Échec d'envoi SMTP pour ${notif.user.email} — sentStatus → FAILED`);
            notif.sentStatus = "FAILED";
          }

          await notif.save();
          console.log(`💾 [WORKER] Notif ${notif._id} sauvegardée avec sentStatus: ${notif.sentStatus}`);

        } catch (err) {
          console.error(`❌ [WORKER] Erreur de traitement pour la notif ${notif._id}:`, err.message);
          console.error(err.stack);
          notif.sentStatus = "FAILED";
          await notif.save();
        }
      }

    } catch (error) {
      console.error("🚨 [WORKER] Erreur critique lors du scan de la DB :", error.message);
      console.error(error.stack);
    }
  });

  console.log("✅ [WORKER] Automate de mail activé (Fréquence : 1 minute)");
};

export default startMailWorker;