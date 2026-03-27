import Task from "../models/Task.js";
import Notification from "../models/Notification.js";

// --- UTILITAIRE : Création de notification ---
const createLog = async (userId, type, message, taskId = null) => {
  try {
    await Notification.create({ user: userId, type, message, taskId });
    console.log(`🔔 Notification créée : ${type}`);
  } catch (error) {
    console.error("❌ Erreur notification :", error.message);
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

// 2. Récupérer une tâche spécifique
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: "ID invalide" });
  }
};

// 3. Créer une tâche
export const createTask = async (req, res) => {
  try {
    const task = new Task({ ...req.body, user: req.user.id });
    const savedTask = await task.save();
    
    // Notification asynchrone
    await createLog(req.user.id, "TASK_CREATED", `Tâche créée : ${savedTask.title}`, savedTask._id);
    
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 4. Mettre à jour (Correction du Warning Mongoose)
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { 
        returnDocument: 'after', // ✅ Remplace 'new: true' pour éviter le warning
        runValidators: true 
      }
    );

    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    await createLog(req.user.id, "TASK_UPDATED", `Mise à jour : ${task.title}`, task._id);
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 5. Supprimer
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    await createLog(req.user.id, "TASK_DELETED", `Suppression : ${task.title}`);

    res.json({ message: "Tâche supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 6. Statut
export const getStatus = (req, res) => {
  res.json({ status: "OK", time: new Date().toISOString() });
};