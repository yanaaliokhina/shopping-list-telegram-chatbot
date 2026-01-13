import dotenv from "dotenv";

export function loadEnv() {
  dotenv.config();

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }

  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  };
}