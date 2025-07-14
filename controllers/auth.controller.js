import bcryptjs from "bcryptjs";
import { sendVerificationEmail, sendWelcomeEmail, sendResetPasswordEmail } from "./email.controller.js";
import { Consumer } from "../models/consumer.model.js";
import { Farmer } from "../models/farmer.model.js";
import { User } from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import stripe from '../utils/stripe.js';
import logger from "../utils/logger.js";
import { validationResult } from "express-validator";
import geoip from 'geoip-lite';
import { sendNewLoginAlertEmail } from "../utils/email.js";

export const signup = async (req, res) => {
	// Handle validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ success: false, errors: errors.array() });
	}

	const { email, password, name, phone, role } = req.body;

	try {
		if (!email || !password || !name || !phone || !role) {
			throw new Error("All fields are required");
		}

		const userAlreadyExists = await User.findOne({ email });
		logger.info("userAlreadyExists", userAlreadyExists);

		if (userAlreadyExists) {
			return res
				.status(400)
				.json({ success: false, message: "User already exists" });
		}

		const hashedPassword = await bcryptjs.hash(password, 10);
		const verificationToken = Math.floor(
			100000 + Math.random() * 900000,
		).toString();

		let user;

		// Create user based on role
		if (role === "consumer") {
			// Create Stripe customer for consumer
			const stripeCustomer = await stripe.customers.create({
				email,
				name,
				phone,
			});

			user = new Consumer({
				email,
				password: hashedPassword,
				name,
				phone,
				role,
				verificationToken,
				verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
				stripeCustomerId: stripeCustomer.id,
			});
		} else if (role === "farmer") {
			const { farmName, introduction } = req.body;

			if (!farmName || !introduction ) {
				throw new Error("Farm details are required for farmer registration");
			}

			user = new Farmer({
				email,
				password: hashedPassword,
				name,
				phone,
				role,
				farmName,
				introduction,
				//farmLocation
				verificationToken,
				verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
			});
		} else {
			throw new Error("Invalid role");
		}

		await user.save();

		// jwt
		generateTokenAndSetCookie(res, user._id);
		await sendVerificationEmail(user.email, verificationToken, user.name);

		res.status(201).json({
			success: true,
			message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
};

export const verifyEmail = async (req, res) => {
	const { code } = req.body;
	try {
		const user = await User.findOne({
			verificationToken: code,
			verificationTokenExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired verification code",
			});
		}

		user.isVerified = true;
		user.verificationToken = undefined;
		user.verificationTokenExpiresAt = undefined;
		await user.save();

		await sendWelcomeEmail(user.email, user.name);

		res.status(200).json({
			success: true,
			message: "Email verified successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		logger.error("error in verifyEmail ", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

export const login = async (req, res) => {
	// Handle validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ success: false, errors: errors.array() });
	}

	const { email, password } = req.body;
	try {
		const user = await User.findOne({ email });
		const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
		const geo = geoip.lookup(ip);
		if (!user) {
			// Log failed attempt for non-existent user (optional: skip for privacy)
			return res
				.status(400)
				.json({ success: false, message: "Invalid credentials" });
		}

		// Email-based login attempt limiting
		const now = Date.now();
		if (user.lockUntil && user.lockUntil > now) {
			user.loginHistory.push({ timestamp: new Date(), ip, success: false, country: geo?.country, city: geo?.city });
			await user.save();
			const wait = Math.ceil((user.lockUntil - now) / 60000);
			return res.status(429).json({
				success: false,
				message: `Too many failed login attempts. Please try again after ${wait} minute(s).`,
			});
		}

		const isPasswordValid = await bcryptjs.compare(password, user.password);
		if (!isPasswordValid) {
			user.loginAttempts = (user.loginAttempts || 0) + 1;
			user.loginHistory.push({ timestamp: new Date(), ip, success: false, country: geo?.country, city: geo?.city });
			if (user.loginAttempts >= 5) {
				user.lockUntil = now + 5 * 60 * 1000; // 5 minutes
				await user.save();
				return res.status(429).json({
					success: false,
					message: "Too many failed login attempts. Please try again after 5 minutes.",
				});
			} else {
				await user.save();
				return res.status(400).json({ success: false, message: "Invalid credentials" });
			}
		}

		// Successful login: reset attempts
		user.loginAttempts = 0;
		user.lockUntil = null;

		// Check if this is a new IP for this user
		const isNewIp = !user.loginHistory.some(h => h.ip === ip && h.success);
		user.loginHistory.push({ timestamp: new Date(), ip, success: true, country: geo?.country, city: geo?.city });

		user.lastLogin = new Date();
		await user.save();

		if (isNewIp) {
			const resetLink = `${process.env.CLIENT_URL}/reset-password`;
			await sendNewLoginAlertEmail({
				to: user.email,
				name: user.name,
				ip,
				city: geo?.city || 'Unknown',
				country: geo?.country || 'Unknown',
				timestamp: new Date().toLocaleString(),
				resetLink,
			});
		}

		const token = generateTokenAndSetCookie(res, user._id);

		res.status(200).json({
			success: true,
			message: "Logged in successfully",
			user: {
				...user._doc,
				password: undefined,
			},
			token,
		});
	} catch (error) {
		logger.error("Error in login: ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};
export const logout = async (req, res) => {
	res.clearCookie("token");
	res.status(200).json({ sucess: true, message: "Logged out sucessfully" });
};

export const forgotPassword = async (req, res) => {
	// Handle validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ success: false, errors: errors.array() });
	}
	const { email } = req.body;
	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ sucess: false, message: "User not found" });
		}
		// Generate a temporary password
		const tempPassword = Math.random().toString(36).slice(-10);
		const hashedTempPassword = await bcryptjs.hash(tempPassword, 10);
		user.password = hashedTempPassword;
		await user.save();

		// Prepare email details
		const resetLink = `${process.env.CLIENT_URL}/reset-password`;
		const expirationTime = '24 hours';
		await sendResetPasswordEmail(user.email, user.name, tempPassword, resetLink, expirationTime);

		res.status(200).json({
			sucess: true,
			message: "Temporary password sent to your email. Please check your inbox.",
		});
	} catch (error) {
		logger.error("Error in forgotPassword ", error);
		res.status(400).json({ sucess: false, message: error.message });
	}
};

export const resetPassword = async (req, res) => {
	// Handle validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ success: false, errors: errors.array() });
	}
	try {
		const { token } = req.params;
		const { password } = req.body;

		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res
				.status(400)
				.json({ sucess: false, message: "Invalid or expired reset token" });
		}

		const hashedPassword = await bcryptjs.hash(password, 10);

		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpiresAt = undefined;
		await user.save();

		await sendVerificationEmail(user.email, user.name);
		res.status(200).json({ sucess: true, message: "Password reset sucessful" });
	} catch (error) {
		logger.error("Error in resetPassword ", error);
		res.status(400).json({ sucess: false, message: error.message });
	}
};

export const checkAuth = async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("-password");
		if (!user) {
			return res.status(400).json({ sucess: false, message: "User not found" });
		}
		res.status(200).json({ sucess: true, user });
	} catch (error) {
		logger.error("Error in checkAuth ", error);
		res.status(400).json({ sucess: false, message: error.message });
	}
};
