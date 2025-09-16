import { Router } from "express";
import { register, login, logout } from "../controllers/authController";
//middleware
import { auth } from "../middleware/auth";

const router = Router();

//Post Register route
router.post("/register", register);

//Post Login route
router.post("/login", login);

//Post Logout route
router.post("/logout", auth, logout);

// Get current user route
router.get("/me", auth, (req, res) => {
    res.json({ user: req.user });
});

export default router;