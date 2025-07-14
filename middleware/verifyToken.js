import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import logger from "../utils/logger.js";

export const verifyToken = async (req, res, next) => {
	const token =
		req.cookies.token ||
		(req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
			? req.headers.authorization.split(" ")[1]
			: null);
	if (!token)
		return res
			.status(401)
			.json({ success: false, message: "Unauthorized no token provided" });
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded)
			return res
				.status(401)
				.json({ success: false, message: "Unauthorized - invalid token" });
		req.userId = decoded.userId;
		// Fetch user and attach to req
		const user = await User.findById(decoded.userId);
		if (!user) {
			return res.status(401).json({ success: false, message: "User not found" });
		}
		req.user = user; // This will include the role
		next();
	} catch (error) {
		logger.error("Error in verifyToken ", error);
		return res.status(500).json({ success: false, message: "Server Error" });
	}
};
