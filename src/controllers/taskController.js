import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import { sendTaskEmail } from "../utils/mailer.js";

/**
 * UTILITAIRE : Création de notification
 * Retourne 'true' si la notification a été envoyée immédiatement (SENT)
 */
const createLog = async (userId, type, message, taskId = null, scheduledFor = new Date(), sendEmail = false, userEmail = null, taskTitle = "") => {
  try {
    const now = new Date();
    const isImmediate = scheduledFor <= now;

    // 1. Sauvegarde en base de données
    await Notification.create({ 
      user: userId, 
      type, 
      message, 
      taskId, 
      scheduledFor, 
      sendEmail,
      sentStatus: isImmediate ? "SENT" : "PENDING" 
    });

    // 2. Envoi immédiat par mail si les conditions sont réunies
    if (sendEmail && isImmediate && userEmail) {
      await sendTaskEmail(userEmail, type, taskTitle, message);
    }

    console.log(`🔔 Log [${type}] créé - Statut: ${isImmediate ? 'SENT' : 'PENDING'}`);
    return isImmediate; // Indique au contrôleur si l'action vient d'avoir lieu
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

// 2. Créer une tâche + Programmation Auto (AVEC LOGIQUE EN COURS)
export const createTask = async (req, res) => {
  try {
    const { title, startDate, endDate } = req.body;
    
    // Création de la tâche (le middleware pre-save du modèle valide les dates)
    let task = new Task({ ...req.body, user: req.user.id });
    let savedTask = await task.save();

    const emailToUse = req.user.email || "lorenzongoulefack01@gmail.com";

    // A. Notification de création immédiate
    await createLog(req.user.id, "TASK_CREATED", `Mission "${title}" enregistrée.`, savedTask._id, new Date(), true, emailToUse, title);

    // B. Programmation du rappel de DÉBUT (5 minutes avant)
    const startReminder = new Date(new Date(startDate).getTime() - 5 * 60000); 
    
    // 🔥 Si le rappel de début est immédiat, on passe la tâche "en cours"
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

    if (isStartingNow) {
      savedTask = await Task.findByIdAndUpdate(
        savedTask._id, 
        { status: "en cours" }, 
        { new: true }
      );
      console.log("🚀 [Auto-Start] La tâche est passée 'en cours' car l'heure de début est atteinte.");
    }

    // C. Programmation du rappel de FIN
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

    // Nettoyage si terminé
    if (task.status === 'terminé') {
        await Notification.deleteMany({ taskId: task._id, sentStatus: "PENDING" });
        console.log("🧹 Rappels futurs supprimés.");
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

    await Notification.deleteMany({ taskId: req.params.id });
    res.json({ message: "Tâche et notifications supprimées" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: "ID invalide" });
  }
};

export const getStatus = (req, res) => {
  res.json({ 
    status: "OK", 
    system_time: new Date().toISOString(),
    user: "Laurence"
  });
};