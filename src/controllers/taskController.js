import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import { sendTaskEmail } from "../utils/mailer.js";

/**
 * UTILITAIRE : Création de notification
 * Gère le statut SENT/PENDING et l'envoi immédiat par mail.
 */
const createLog = async (userId, type, message, taskId = null, scheduledFor = new Date(), sendEmail = false, userEmail = null, taskTitle = "") => {
  try {
    const now = new Date();
    // 💡 On force la conversion en objet Date pour une comparaison fiable
    const scheduledDate = new Date(scheduledFor);
    const isImmediate = scheduledDate <= now;

    // 1. Sauvegarde en base de données
    await Notification.create({ 
      user: userId, 
      type, 
      message, 
      taskId, 
      scheduledFor: scheduledDate, 
      sendEmail,
      sentStatus: isImmediate ? "SENT" : "PENDING" 
    });

    // 2. Envoi immédiat par mail si c'est pour "Maintenant"
    if (sendEmail && isImmediate && userEmail) {
      await sendTaskEmail(userEmail, type, taskTitle, message);
    }

    console.log(`🔔 Log [${type}] - Statut: ${isImmediate ? 'SENT' : 'PENDING'} | Prévu le: ${scheduledDate.toLocaleString('fr-FR')}`);
    return isImmediate; 
  } catch (error) {
    console.error("❌ Erreur utilitaire createLog :", error.message);
    return false;
  }
};

// 1. Récupérer les tâches (Filtres + Pagination)
export const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, search } = req.query;
    let query = { user: req.user.id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.title = { $regex: search, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tasks = await Task.find(query)
      .sort({ startDate: 1 }) 
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      tasks
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 2. Créer une tâche + Programmation Automatique
export const createTask = async (req, res) => {
  try {
    const { title, startDate, endDate } = req.body;
    
    // Création de la tâche
    let task = new Task({ ...req.body, user: req.user.id });
    let savedTask = await task.save();

    const emailToUse = req.user.email || "lorenzongoulefack01@gmail.com";

    // A. Notification de création immédiate
    await createLog(req.user.id, "TASK_CREATED", `Mission "${title}" enregistrée.`, savedTask._id, new Date(), true, emailToUse, title);

    // B. Programmation du rappel de DÉBUT (5 minutes avant)
    // 💡 Calcul précis en millisecondes
    const startReminderTime = new Date(startDate).getTime() - (5 * 60000);
    const startReminder = new Date(startReminderTime); 
    
    const isStartingNow = await createLog(
      req.user.id, 
      "TASK_STARTING", 
      `Alerte : Votre mission "${title}" est lancée !`, 
      savedTask._id, 
      startReminder, 
      true, 
      emailToUse, 
      title
    );

    // 🔥 Si l'heure de début (moins 5 min) est déjà passée, on active la tâche
    if (isStartingNow) {
      savedTask = await Task.findByIdAndUpdate(
        savedTask._id, 
        { status: "en cours" }, 
        { new: true }
      );
      console.log(`🚀 [Auto-Start] "${title}" est passée 'en cours'.`);
    }

    // C. Programmation du rappel de FIN (à l'heure exacte de endDate)
    await createLog(req.user.id, "TASK_ENDING", `Alerte : Fin de mission imminente pour "${title}".`, savedTask._id, new Date(endDate), true, emailToUse, title);

    res.status(201).json(savedTask);
  } catch (error) {
    console.error("❌ Erreur CreateTask :", error.message);
    res.status(400).json({ error: error.message });
  }
};

// 3. Mettre à jour + Recalcul des Notifications
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );

    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    await createLog(req.user.id, "TASK_UPDATED", `Modification de la mission "${task.title}".`, task._id);

    // 🧹 Nettoyage : Si la tâche est finie, on supprime les rappels inutiles
    if (task.status === 'terminé') {
        await Notification.deleteMany({ taskId: task._id, sentStatus: "PENDING" });
        console.log(`🧹 Rappels futurs annulés pour : ${task.title}`);
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 4. Supprimer
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    // On supprime aussi toutes les notifications liées
    await Notification.deleteMany({ taskId: req.params.id });
    res.json({ message: "Tâche et notifications supprimées avec succès" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 5. Récupérer une tâche spécifique
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: "ID invalide" });
  }
};

// 6. Route Status (Pour vérifier le serveur au Cameroun)
export const getStatus = (req, res) => {
  const now = new Date();
  res.json({ 
    status: "OK", 
    system_time_utc: now.toISOString(),
    system_time_cameroun: now.toLocaleString('fr-FR', { timeZone: 'Africa/Lagos' }),
    timezone_env: process.env.TZ,
    user: "Laurence"
  });
};