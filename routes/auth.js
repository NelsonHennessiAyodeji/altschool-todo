const express = require("express");
const router = express.Router();
const User = require("../models/User");
const {
  registerValidation,
  loginValidation,
} = require("../middleware/validation");
const { isNotAuthenticated } = require("../middleware/auth");

// Register Page
router.get("/register", isNotAuthenticated, (req, res) => {
  res.render("auth/register", {
    title: "Register",
    errors: req.flash("error"),
    success: req.flash("success"),
    formData: req.flash("formData")[0] || {},
  });
});

// Register User
router.post("/register", isNotAuthenticated, async (req, res) => {
  try {
    const { error } = registerValidation(req.body);
    if (error) {
      req.flash("error", error.details[0].message);
      req.flash("formData", req.body);
      return res.redirect("/register");
    }

    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      req.flash("error", "User with this email or username already exists");
      req.flash("formData", req.body);
      return res.redirect("/register");
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    req.flash("success", "Registration successful! Please login.");
    res.redirect("/login");
  } catch (error) {
    console.error("Registration error:", error);
    req.flash("error", "An error occurred during registration");
    req.flash("formData", req.body);
    res.redirect("/register");
  }
});

// Login Page
router.get("/login", isNotAuthenticated, (req, res) => {
  res.render("auth/login", {
    title: "Login",
    errors: req.flash("error"),
    formData: req.flash("formData")[0] || {},
  });
});

// Login User
router.post("/login", isNotAuthenticated, async (req, res) => {
  try {
    const { error } = loginValidation(req.body);
    if (error) {
      req.flash("error", error.details[0].message);
      req.flash("formData", req.body);
      return res.redirect("/login");
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "Invalid email or password");
      req.flash("formData", req.body);
      return res.redirect("/login");
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash("error", "Invalid email or password");
      req.flash("formData", req.body);
      return res.redirect("/login");
    }

    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;

    req.flash("success", `Welcome back, ${user.username}!`);
    res.redirect("/tasks");
  } catch (error) {
    console.error("Login error:", error);
    req.flash("error", "An error occurred during login");
    res.redirect("/login");
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login");
  });
});

module.exports = router;
