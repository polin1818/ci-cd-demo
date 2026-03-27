let tasks = [];
let id = 1;

export const getTasks = (req, res) => {
  res.json(tasks);
};

export const getTaskById = (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
};

export const createTask = (req, res) => {
  const { title } = req.body;
  const newTask = { id: id++, title };
  tasks.push(newTask);
  res.status(201).json(newTask);
};

export const updateTask = (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: "Task not found" });

  task.title = req.body.title || task.title;
  res.json(task);
};

export const deleteTask = (req, res) => {
  tasks = tasks.filter(t => t.id !== parseInt(req.params.id));
  res.json({ message: "Task deleted" });
};