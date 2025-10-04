const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash("error", "Please login to access this page");
  return res.redirect("/login");
};

const isNotAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return next();
  }
  res.redirect("/tasks");
};

module.exports = { isAuthenticated, isNotAuthenticated };
