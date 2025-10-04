const express = require("express");
const router = express.Router();
const Task = require("../models/Tasks");
const { taskValidation } = require("../middleware/validation");
const { isAuthenticated } = require("../middleware/auth");

// Get all tasks with filtering
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.session.userId, status: { $ne: "deleted" } };

    if (status && ["pending", "completed"].includes(status)) {
      filter.status = status;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.render("tasks/index", {
      title: "My Tasks",
      tasks,
      currentFilter: status || "all",
      success: req.flash("success"),
      errors: req.flash("error"),
      username: req.session.username,
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    req.flash("error", "Error loading tasks");
    res.redirect("/tasks");
  }
});

// Create Task Page
router.get("/new", isAuthenticated, (req, res) => {
  res.render("tasks/new", {
    title: "Create New Task",
    errors: req.flash("error"),
    formData: req.flash("formData")[0] || {},
    username: req.session.username,
  });
});

// Create Task
router.post("/", isAuthenticated, async (req, res) => {
  try {
    console.log("Creating task with data:", req.body); // Debug log

    const { error } = taskValidation(req.body);
    if (error) {
      console.log("Validation error:", error.details[0].message); // Debug log
      req.flash("error", error.details[0].message);
      req.flash("formData", req.body);
      return res.redirect("/tasks/new");
    }

    const task = new Task({
      title: req.body.title,
      description: req.body.description || "",
      dueDate: req.body.dueDate || null,
      user: req.session.userId,
    });

    await task.save();
    console.log("Task created successfully:", task._id); // Debug log

    req.flash("success", "Task created successfully!");
    res.redirect("/tasks");
  } catch (error) {
    console.error("Create task error:", error);
    req.flash("error", "Error creating task: " + error.message);
    req.flash("formData", req.body);
    res.redirect("/tasks/new");
  }
});

// Update Task Status
router.post("/:id/status", isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = req.params.id;

    console.log("Updating task status:", { taskId, status }); // Debug log

    const task = await Task.findOne({
      _id: taskId,
      user: req.session.userId,
    });

    if (!task) {
      req.flash("error", "Task not found");
      return res.redirect("/tasks");
    }

    if (!["pending", "completed"].includes(status)) {
      req.flash("error", "Invalid status");
      return res.redirect("/tasks");
    }

    task.status = status;
    await task.save();

    console.log("Task status updated successfully"); // Debug log
    req.flash("success", `Task marked as ${status}`);
    res.redirect("/tasks");
  } catch (error) {
    console.error("Update task status error:", error);
    req.flash("error", "Error updating task: " + error.message);
    res.redirect("/tasks");
  }
});

// Delete Task (soft delete)
router.post("/:id/delete", isAuthenticated, async (req, res) => {
  try {
    const taskId = req.params.id;

    console.log("Deleting task:", taskId); // Debug log

    const task = await Task.findOne({
      _id: taskId,
      user: req.session.userId,
    });

    if (!task) {
      req.flash("error", "Task not found");
      return res.redirect("/tasks");
    }

    task.status = "deleted";
    await task.save();

    console.log("Task deleted successfully"); // Debug log
    req.flash("success", "Task deleted successfully");
    res.redirect("/tasks");
  } catch (error) {
    console.error("Delete task error:", error);
    req.flash("error", "Error deleting task: " + error.message);
    res.redirect("/tasks");
  }
});

module.exports = router;
