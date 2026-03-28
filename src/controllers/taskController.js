import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendTaskEmail } from "../utils/mailer.js";

const createLog = async (userId, type, message, taskId = null, scheduledFor = new Date(), sendEmail = false, userEmail = null, taskTitle = "") => {
  try {
    const now = new Date();
    const scheduledDate = new Date(scheduledFor);
    const isImmediate = scheduledDate <= now;

    await Notification.create({ 
      user: userId, 
      type, 
      message, 
      taskId, 
      scheduledFor: scheduledDate, 
      sendEmail,
      sentStatus: isImmediate ? "SENT" : "PENDING" 
    });

    if (sendEmail && isImmediate && userEmail) {
      const sent = await sendTaskEmail(userEmail, type, taskTitle, message);
      if (!sent) console.warn(`⚠️ [createLog] Email non envoyé pour [${type}] à ${userEmail}`);
    }

    console.log(`🔔 Log [${type}] - Statut: ${isImmediate ? 'SENT' : 'PENDING'} | Prévu le: ${scheduledDate.toLocaleString('fr-FR')}`);
    return isImmediate; 
  } catch (error) {
    console.error("❌ Erreur utilitaire createLog :", error.message);
    return false;
  }
};

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

export const createTask = async (req, res) => {
  try {
    const { title, startDate, endDate } = req.body;

    // ✅ Récupération de l'email depuis la DB (le token ne le contient pas)
    const userDoc = await User.findById(req.user.id).select("email");
    if (!userDoc?.email) return res.status(400).json({ error: "Email utilisateur introuvable" });
    const emailToUse = userDoc.email;

    let task = new Task({ ...req.body, user: req.user.id });
    let savedTask = await task.save();

    // A. Notification immédiate de création
    await createLog(req.user.id, "TASK_CREATED", `Mission "${title}" enregistrée.`, savedTask._id, new Date(), true, emailToUse, title);

    // B. Rappel de début (5 min avant startDate)
    const startReminder = new Date(new Date(startDate).getTime() - 5 * 60000);
    const isStartingNow = await createLog(
      req.user.id, "TASK_STARTING",
      `Alerte : Votre mission "${title}" est lancée !`,
      savedTask._id, startReminder, true, emailToUse, title
    );

    if (isStartingNow) {
      savedTask = await Task.findByIdAndUpdate(savedTask._id, { status: "en cours" }, { new: true });
      console.log(`🚀 [Auto-Start] "${title}" est passée 'en cours'.`);
    }

    // C. Rappel de fin (à l'heure exacte de endDate)
    await createLog(req.user.id, "TASK_ENDING", `Alerte : Fin de mission imminente pour "${title}".`, savedTask._id, new Date(endDate), true, emailToUse, title);

    res.status(201).json(savedTask);
  } catch (error) {
    console.error("❌ Erreur CreateTask :", error.message);
    res.status(400).json({ error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );

    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    await createLog(req.user.id, "TASK_UPDATED", `Modification de la mission "${task.title}".`, task._id);

    if (task.status === 'terminé') {
      await Notification.deleteMany({ taskId: task._id, sentStatus: "PENDING" });
      console.log(`🧹 Rappels futurs annulés pour : ${task.title}`);
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    await Notification.deleteMany({ taskId: req.params.id });
    res.json({ message: "Tâche et notifications supprimées avec succès" });
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
  const now = new Date();
  res.json({ 
    status: "OK", 
    system_time_utc: now.toISOString(),
    system_time_cameroun: now.toLocaleString('fr-FR', { timeZone: 'Africa/Lagos' }),
    timezone_env: process.env.TZ,
    user: "Laurence"
  });
};