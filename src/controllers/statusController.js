import Task from "../models/Task.js";
import Notification from "../models/Notification.js";

// --- UTILITAIRE : Créer une notification (Interne) ---
const createLog = async (userId, type, message, taskId = null) => {
  try {
    await Notification.create({ user: userId, type, message, taskId });
  } catch (error) {
    console.error("Erreur de notification:", error);
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({ currentPage: parseInt(page), totalPages: Math.ceil(total / limit), totalTasks: total, tasks });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
};

// 2. Créer une tâche (+ Notification)
export const createTask = async (req, res) => {
  try {
    const task = new Task({ ...req.body, user: req.user.id });
    const savedTask = await task.save();

    await createLog(req.user.id, "TASK_CREATED", `Tâche créée : ${savedTask.title}`, savedTask._id);

    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 3. Mettre à jour (+ Notification)
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    await createLog(req.user.id, "TASK_UPDATED", `Tâche mise à jour : ${task.title}`, task._id);

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 4. Supprimer (+ Notification)
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    await createLog(req.user.id, "TASK_DELETED", `Tâche supprimée : ${task.title}`);

    res.json({ message: "Tâche supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
};

// 5. Status de l'API (Public)
export const getStatus = (req, res) => {
  res.json({
    status: "OK",
    service: "Task Management API",
    version: "1.0.0",
    time: new Date().toISOString(),
  });
};