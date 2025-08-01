import path from "node:path";
import { fileURLToPath } from "node:url";
import winston from "winston";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	winston.format.errors({ stack: true }),
	winston.format.splat(),
	winston.format.json(),
);

// Create the logger
const logger = winston.createLogger({
	level: process.env.NODE_ENV === "production" ? "info" : "debug",
	format: logFormat,
	defaultMeta: { service: "backend-service" },
	transports: [
		// Write all logs with level 'error' and below to 'error.log'
		new winston.transports.File({
			filename: path.join(__dirname, "../logs/error.log"),
			level: "error",
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
		// Write all logs with level 'info' and below to 'combined.log'
		new winston.transports.File({
			filename: path.join(__dirname, "../logs/combined.log"),
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
	],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== "production") {
	logger.add(
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
	);
}

// Create a stream object for Morgan
logger.stream = {
	write: (message) => logger.info(message.trim()),
};

export default logger;
