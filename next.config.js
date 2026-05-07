/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
	allowedDevOrigins: ["100.74.215.90", "0e33-79-174-252-178.ngrok-free.app"],
};

export default config;
