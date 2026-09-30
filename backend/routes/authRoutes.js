import express from "express";
import { register, login, logout, getMe, updatePassword } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { registerRules, loginRules, updatePasswordRules } from "../validators/authValidators.js";

const router = express.Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/update-password", protect, updatePasswordRules, validate, updatePassword);

export default router;
