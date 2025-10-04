require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("express-flash");
const morgan = require("morgan");
const path = require("path");
const dbConnect = require("./database/db");

const app = express();

// Middleware
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/todoapp",
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use(flash());

// Make user data available to all views
app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.userId = req.session.userId;
  next();
});

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/", require("./routes/auth"));
app.use("/tasks", require("./routes/tasks"));

// Home route redirect
app.get("/", (req, res) => {
  if (req.session.userId) {
    res.redirect("/tasks");
  } else {
    res.redirect("/login");
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  if (req.session) {
    req.flash("error", "Something went wrong! Please try again.");
  }

  if (req.accepts("html")) {
    res.redirect("back");
  } else {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Debug route
app.get("/debug/tasks", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const tasks = await Task.find({ user: req.session.userId });
    res.json({
      userId: req.session.userId,
      tasks: tasks,
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("error/404", {
    title: "Page Not Found",
    username: req.session.username,
  });
});

const PORT = process.env.PORT || 3000;

// Server startup logic
const startServer = async () => {
  try {
    // DB was setup in such a way that if the DB does not connect due to anykind of issue, the server will not run.
    await dbConnect(process.env.MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`Server runnning on port localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

startServer();
