import dotenv from "dotenv";

export function loadEnv() {
  dotenv.config();

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }

  if (!process.env.DATABASE_PATH) {
    throw new Error("DATABASE_PATH is missing");
  }

  if (! process.env.MEMCACHE_URL) {
    throw new Error("MEMCACHE_URL is missing");
  }
  
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    dbPath: process.env.DATABASE_PATH
  };
}