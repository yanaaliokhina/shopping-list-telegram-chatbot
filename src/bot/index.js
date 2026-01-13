import TelegramBot from "node-telegram-bot-api";
import { loadEnv } from "../utils/env.js";

const { botToken } = loadEnv();

export const bot = new TelegramBot(botToken, { polling: true });