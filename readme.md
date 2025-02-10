backend/
├── models/             // Database models (e.g., User.js)
│   └── User.js
├── routes/             // API routes
│   ├── auth.js       // Authentication routes (login, register)
│   ├── event.js        // Event-related routes (protected)
│   └── user.js        // User-related routes (protected)
├── middleware/         // Middleware functions
│   └── authMiddleware.js // JWT verification middleware
├── config/             // Configuration files
│   └── db.js         // Database connection config
├── controllers/       // Logic for the routes
│   └── authController.js
│   └── eventController.js
│   └── userController.js
├── utils/              // Helper functions
│   └── generateToken.js // Function to generate JWTs
├── server.js              // Main server file (Express.js setup)
└── package.json

<!-- ------------------------------------------------------------------------------------------ -->


To set up authentication and authorization using JWT (JSON Web Tokens) in your backend directory structure, follow these steps. I'll guide you through each file and provide the necessary code.

---

### **1. Install Required Dependencies**
Run the following command in your backend directory:
```bash
npm install express mongoose bcryptjs jsonwebtoken dotenv cors
```

---

### **2. Set Up Environment Variables**
Create a `.env` file in the root of your backend directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/your_database_name
JWT_SECRET=your_jwt_secret_key
```

---

### **3. Database Configuration (`config/db.js`)**
Set up the MongoDB connection:
```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

### **4. User Model (`models/User.js`)**
Define the `User` schema:
```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
```

---

### **5. JWT Token Generation (`utils/generateToken.js`)**
Create a utility function to generate JWT tokens:
```javascript
const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1h", // Token expires in 1 hour
  });
};

module.exports = generateToken;
```

---

### **6. Authentication Middleware (`middleware/authMiddleware.js`)**
Create middleware to verify JWT tokens:
```javascript
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;
```

---

### **7. Authentication Controller (`controllers/authController.js`)**
Handle user registration and login:
```javascript
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// Register a new user
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);

    res.status(201).json({ userId: user._id, token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    res.json({ userId: user._id, token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser, loginUser };
```

---

### **8. Authentication Routes (`routes/auth.js`)**
Set up routes for registration and login:
```javascript
const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");

const router = express.Router();

// Register a new user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

module.exports = router;
```

---

### **9. Protected Routes (`routes/event.js` and `routes/user.js`)**
Example of a protected route:
```javascript
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Example protected route
router.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route", userId: req.userId });
});

module.exports = router;
```

---

### **10. Main Server File (`server.js`)**
Set up the Express server:
```javascript
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/events", require("./routes/event"));
app.use("/api/users", require("./routes/user"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### **11. Update `package.json`**
Add a start script to your `package.json`:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

---

### **12. Test Your Setup**
1. Start the server:
   ```bash
   npm run dev
   ```
2. Use tools like Postman or Thunder Client to test the following endpoints:
   - `POST /api/auth/register` - Register a new user.
   - `POST /api/auth/login` - Login and get a JWT token.
   - `GET /api/events/protected` - Access a protected route using the JWT token in the `Authorization` header.

---

This setup provides a solid foundation for JWT-based authentication and authorization in your backend. You can now expand the `eventController.js` and `userController.js` files to handle additional logic for your application.