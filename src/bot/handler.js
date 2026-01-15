import {
    TELEGRAM_BOT_VIEW_LIST_MENU_ITEM,
    TELEGRAM_BOT_MAIN_MENU,
    TELEGRAM_BOT_ADD_ITEMS_MENU_ITEM,
    TELEGRAM_BOT_ADD_ITEMS_MENU,
    TELEGRAM_BOT_CANCEL_ADD_ITEMS_MENU_ITEM,
    TELEGRAM_BOT_CANCEL_MARK_ITEMS_BOUGHT_MENU_ITEM,
    TELEGRAM_BOT_DELETE_ITEMS_MENU_ITEM,
    MENU_ITEM_ERROR,
} from "./constants.js";

export class TelegramBotCommandHandler {

    constructor(userService, itemService, bot) {
        this.userService = userService;
        this.itemService = itemService;
        this.bot = bot;
        this.userState = new Map();
    }

    async handleStartCommand(msg) {
        const chatId = msg?.chat?.id;

        try {
            await this.userService.getOrCreateUser(msg.from.id);

            this.bot.sendMessage(
                chatId,
                "🛒 *Welcome to Shopping List Bot!*\n\nWhat would you like to do?",
                { parse_mode: "Markdown", ...TELEGRAM_BOT_MAIN_MENU }
            );
        } catch (error) {
            console.error("handleStartCommand failed:", {
                error,
                user: msg.from.id
            });

            this.bot.sendMessage(chatId, MENU_ITEM_ERROR);
        }
    }

    async handleStopCommand(msg) {
        const chatId = msg?.chat?.id;

        try {
            this.bot.sendMessage(
                chatId,
                "👋 Bot stopped. Use /start to activate again.",
                { reply_markup: { remove_keyboard: true } }
            );
        } catch (error) {
            console.error("handleStopCommand failed:", {
                error,
                user: msg.from.id
            });

            this.bot.sendMessage(chatId, MENU_ITEM_ERROR);
        }
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
            case TELEGRAM_BOT_CANCEL_MARK_ITEMS_BOUGHT_MENU_ITEM: {
                await this.handleMarkItemsBoughtCommand(msg);
                break;
            }
            case TELEGRAM_BOT_DELETE_ITEMS_MENU_ITEM: {
                await this.handleDeleteItemsCommand(msg);
                break;
            }
            default:
                await this.handleTextTypingCommand(msg);
        }
    }

    async handleViewListCommand(msg) {
        const chatId = msg?.chat?.id;

        try {
            const userId = await this.userService.getOrCreateUser(msg.from.id);
            const items = await this.itemService.getItems(userId);

            if (items.length === 0) {
                this.bot.sendMessage(chatId, "🛍️ Your list is empty!", TELEGRAM_BOT_MAIN_MENU);

            } else {
                const list = items
                    .map((i) => `${i.bought ? "✅" : "📋"} ${i.name}`)
                    .join("\n");

                this.bot.sendMessage(chatId, `📝 *Your Shopping List:*\n\n${list}`, {
                    parse_mode: "Markdown",
                    TELEGRAM_BOT_MAIN_MENU
                });
            }
        } catch (error) {
            console.error("handleViewListCommand failed:", {
                error,
                user: msg.from.id
            });

            this.bot.sendMessage(chatId, MENU_ITEM_ERROR);
        }
    }

    async handleAddItemsCommand(msg) {
        const chatId = msg?.chat?.id;

        try {
            this.userState.set(msg.from.id, { mode: "ADDING_ITEMS" });

            this.bot.sendMessage(
                chatId,
                "✏️ Send an item name.\n\nYou can add multiple items one by one.\nPress ❌ Cancel when done.",
                TELEGRAM_BOT_ADD_ITEMS_MENU
            );
        } catch (error) {
            console.error("handleAddItemsCommand failed:", {
                error,
                user: msg.from.id
            });

            this.bot.sendMessage(chatId, MENU_ITEM_ERROR);
        }
    }

    async handleTextTypingCommand(msg) {
        const chatId = msg?.chat?.id;

        try {
            const state = this.userState.get(msg.from.id);
            const text = msg.text;

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
        } catch (error) {
            console.error("handleTextTypingCommand failed:", {
                error,
                user: msg.from.id
            });

            this.bot.sendMessage(chatId, MENU_ITEM_ERROR);
        }
    }

    async handleCancelAddItemsCommand(msg) {
        const chatId = msg?.chat?.id;

        try {
            const userId = await this.userService.getOrCreateUser(msg.from.id);
            this.userState.delete(userId);

            this.bot.sendMessage(
                chatId,
                "✅ Add mode exited.",
                TELEGRAM_BOT_MAIN_MENU
            );
        } catch (error) {
            console.error("handleCancelAddItemsCommand failed:", {
                error,
                user: msg.from.id
            });

            this.bot.sendMessage(chatId, MENU_ITEM_ERROR);
        }
    }

    async handleMarkItemsBoughtCommand(msg) {
        const chatId = msg?.chat?.id;

        try {
            const userId = await this.userService.getOrCreateUser(msg.from.id);
            const items = await this.itemService.getUnboughtItems(userId);

            if (items.length === 0) {
                this.bot.sendMessage(chatId, "🎉 All items already bought!", TELEGRAM_BOT_MAIN_MENU);
                return;
            }

            this.bot.sendMessage(chatId, "Select items:", {
                reply_markup: {
                    inline_keyboard: items.map((i) => [
                        { text: `🛒 ${i.name}`, callback_data: `buy_${i.id}` }
                    ])
                }
            });
        } catch (error) {
            console.error("handleMarkItemsBoughtCommand failed:", {
                error,
                user: msg.from.id
            });

            this.bot.sendMessage(chatId, MENU_ITEM_ERROR);
        }
    }

    async handleCallbackQuery(query) {
        const { message, data } = query;
        const chatId = message.chat.id;

        try {
            if (query.data === "disabled") {
                return this.bot.answerCallbackQuery(query.id, {
                    text: "Already processes",
                    show_alert: false
                });
            }

            if (data.startsWith("delete_")) {
                await this.handleDeleteItemCallbackQuery(query);
            } else if (data.startsWith("buy_")) {
                await this.handleMarkItemAsBoughtCallbackQuery(query);
            }
        } catch (error) {
            console.error("handleCallbackQuery failed:", {
                error,
                user: message.from.id
            });

            this.bot.sendMessage(chatId, MENU_ITEM_ERROR);
        }
    }

    async handleDeleteItemsCommand(msg) {
        const chatId = msg.chat.id;

        try {
            const userId = await this.userService.getOrCreateUser(msg.from.id);
            const items = await this.itemService.getItems(userId);

            if (!items.length) {
                return this.bot.sendMessage(
                    chatId,
                    "🛍️ Your list is empty!",
                    TELEGRAM_BOT_MAIN_MENU
                );
            }

            this.bot.sendMessage(chatId, "Select items to delete:", {
                reply_markup: {
                    inline_keyboard: items.map(i => [
                        { text: `🗑️ ${i.name}`, callback_data: `delete_${i.id}` }
                    ])
                }
            });
        } catch (error) {
            console.error("handleDeleteItemsCommand failed:", error);

            this.bot.sendMessage(chatId, MENU_ITEM_ERROR);
        }
    }

    async handleDeleteItemCallbackQuery(query) {
        const { message, data } = query;
        const [, itemId] = data.split("_");

        await this.itemService.deleteItem(itemId);

        const updatedKeyboard =
            message.reply_markup.inline_keyboard.map(row =>
                row.map(button => {
                    if (button.callback_data === `delete_${itemId}`) {
                        return {
                            text: "✅ Deleted",
                            callback_data: "disabled"
                        };
                    }
                    return button;
                })
            );

        this.bot.editMessageReplyMarkup(
            { inline_keyboard: updatedKeyboard },
            {
                chat_id: message.chat.id,
                message_id: message.message_id
            }
        );
    }

    async handleMarkItemAsBoughtCallbackQuery(query) {
        const { message, data } = query;
        const [, itemId] = data.split("_");

        await this.itemService.markBought(itemId);

        const updatedKeyboard = message.reply_markup.inline_keyboard.map(row =>
            row.map(button => {
                if (button.callback_data === `buy_${itemId}`) {
                    return {
                        text: "✅ Bought",
                        callback_data: "disabled"
                    };
                }

                return button;
            })
        );

        this.bot.editMessageReplyMarkup(
            { inline_keyboard: updatedKeyboard },
            {
                chat_id: message.chat.id,
                message_id: message.message_id
            }
        );
    }
}
