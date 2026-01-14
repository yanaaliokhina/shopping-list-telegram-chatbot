import {
    TELEGRAM_BOT_VIEW_LIST_MENU_ITEM,
    TELEGRAM_BOT_MAIN_MENU,
    TELEGRAM_BOT_ADD_ITEMS_MENU_ITEM,
    TELEGRAM_BOT_ADD_ITEMS_MENU,
    TELEGRAM_BOT_CANCEL_ADD_ITEMS_MENU_ITEM,
} from "./constants.js";

export class TelegramBotCommandHandler {

    constructor(userService, itemService, bot) {
        this.userService = userService;
        this.itemService = itemService;
        this.bot = bot;
        this.userState = new Map();
    }

    async handleStartCommand(msg) {
        const chatId = msg.chat.id;
        await this.userService.getOrCreateUser(msg.from.id);

        this.bot.sendMessage(
            chatId,
            "🛒 *Welcome to Shopping List this.bot!*\n\nWhat would you like to do?",
            { parse_mode: "Markdown", ...TELEGRAM_BOT_MAIN_MENU }
        );
    }

    async handleStopCommand(msg) {
        const chatId = msg.chat.id;

        this.bot.sendMessage(
            chatId,
            "👋 Bot stopped. Use /start to activate again.",
            { reply_markup: { remove_keyboard: true } }
        );
    }

    async handleMessageCommand(msg) {
        const text = msg.text;

        switch (text) {
            case TELEGRAM_BOT_VIEW_LIST_MENU_ITEM: {
                await this.handleViewListCommand(msg);
                break;
            }
            case TELEGRAM_BOT_ADD_ITEMS_MENU_ITEM: {
                await this.handleAddItemsCommand(msg);
                break;
            }
            case TELEGRAM_BOT_CANCEL_ADD_ITEMS_MENU_ITEM: {
                await this.handleCancelAddItemsCommand(msg);
                break;
            }
            default:
                await this.handleTextTypingCommand(msg);
        }
    }

    async handleViewListCommand(msg) {
        const chatId = msg.chat.id;

        const userId = await this.userService.getOrCreateUser(msg.from.id);
        const items = await this.itemService.getItems(userId);

        if (items.length === 0) {
            this.bot.sendMessage(chatId, "🛍️ Your list is empty!", TELEGRAM_BOT_MAIN_MENU);

        } else {
            const list = items
                .map((i, idx) => `${idx + 1}. ${i.bought ? "✅" : "🟢"} ${i.name}`)
                .join("\n");

            this.bot.sendMessage(chatId, `📝 *Your Shopping List:*\n\n${list}`, {
                parse_mode: "Markdown",
                TELEGRAM_BOT_MAIN_MENU
            });
        }
    }

    async handleAddItemsCommand(msg) {
        const chatId = msg.chat.id;

        this.userState.set(msg.from.id, { mode: "ADDING_ITEMS" });

        this.bot.sendMessage(
            chatId,
            "✏️ Send an item name.\n\nYou can add multiple items one by one.\nPress ❌ Cancel when done.",
            TELEGRAM_BOT_ADD_ITEMS_MENU
        );
    }

    async handleTextTypingCommand(msg) {
        const state = this.userState.get(msg.from.id);
        const text = msg.text;
        const chatId = msg.chat.id;

        if (state?.mode !== "ADDING_ITEMS") return;
        if (!text || text.startsWith("/")) return;

        const userId = await this.userService.getOrCreateUser(msg.from.id);
        await this.itemService.addItem(userId, text.trim());

        this.bot.sendMessage(
            chatId,
            `✅ *${text}* added.\n\nAdd another item or press ❌ Cancel.`,
            {
                parse_mode: "Markdown",
                ...TELEGRAM_BOT_ADD_ITEMS_MENU,
            }
        );
    }

    async handleCancelAddItemsCommand(msg) {
        const chatId = msg.chat.id;
        
        const userId = await this.userService.getOrCreateUser(msg.from.id);
        this.userState.delete(userId);

        this.bot.sendMessage(
            chatId,
            "✅ Add mode exited.",
            TELEGRAM_BOT_MAIN_MENU
        );
    }
}
