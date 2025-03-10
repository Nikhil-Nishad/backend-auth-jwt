const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Example protected route
router.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route", userId: req.userId });
});

module.exports = router;
