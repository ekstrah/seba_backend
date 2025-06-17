// eslint.config.js
import { defineConfig } from "eslint/config";
import globals from "globals";
import jsConfig from "@eslint/js"; // Import CommonJS module as default

const { configs } = jsConfig;

export default defineConfig([
	{
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.node,
				...globals.es2021,
			},
		},
		...configs.recommended,
		rules: {
			"no-unused-vars": "warn",
			"no-undef": "warn",
		},
	},
]);
