import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        // Check for special token first
        if (token === process.env.SPECIAL_TOKEN) {
            // For special token, set a default user ID for testing
            req.user = { userId: process.env.TEST_USER_ID || "000000000000000000000000" };
            return next();
        }

        // Regular JWT token verification
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid token" });
    }
}; 