import express from "express";
import { authCheck, signup, login, logout } from "../controllers/auth.controllers.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

// protectRoute = middleware
router.get("/auth-check", protectRoute, authCheck);

export default router;