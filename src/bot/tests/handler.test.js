import { describe, jest, beforeEach, test, expect } from "@jest/globals";
import { TelegramBotCommandHandler } from "../handler.js";
import {
    TELEGRAM_BOT_VIEW_LIST_MENU_ITEM,
    TELEGRAM_BOT_MAIN_MENU,
    TELEGRAM_BOT_ADD_ITEMS_MENU_ITEM,
    TELEGRAM_BOT_ADD_ITEMS_MENU,
    TELEGRAM_BOT_CANCEL_ADD_ITEMS_MENU_ITEM,
    TELEGRAM_BOT_CANCEL_MARK_ITEMS_BOUGHT_MENU_ITEM,
    TELEGRAM_BOT_DELETE_ITEMS_MENU_ITEM,
    MENU_ITEM_ERROR,
} from "../constants.js";

describe("TelegramBotCommandHandler", () => {
    let userService;
    let itemService;
    let bot;
    let handler;

    const baseMsg = {
        chat: { id: 100 },
        from: { id: 200 },
        text: ""
    };

    beforeEach(() => {
        userService = {
            getOrCreateUser: jest.fn()
        };

        itemService = {
            getItems: jest.fn(),
            getUnboughtItems: jest.fn(),
            addItem: jest.fn(),
            markBought: jest.fn(),
            deleteItem: jest.fn(),
        };

        bot = {
            sendMessage: jest.fn(),
            editMessageReplyMarkup: jest.fn(),
            answerCallbackQuery: jest.fn()
        };

        handler = new TelegramBotCommandHandler(userService, itemService, bot);
    });

    describe("handleStartCommand()", () => {
        test("sends welcome message", async () => {
            userService.getOrCreateUser.mockResolvedValue(1);

            await handler.handleStartCommand(baseMsg);

            expect(userService.getOrCreateUser).toHaveBeenCalledWith(200);
            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                expect.stringContaining("Welcome"),
                expect.objectContaining(TELEGRAM_BOT_MAIN_MENU)
            );
        });

        test("shows error message on failure", async () => {
            userService.getOrCreateUser.mockRejectedValue(new Error("DB error"));

            await handler.handleStartCommand(baseMsg);

            expect(bot.sendMessage).toHaveBeenCalledWith(100, MENU_ITEM_ERROR);
        });
    });

    describe("handleStopCommand()", () => {
        test("sends stop message and removes keyboard", async () => {
            await handler.handleStopCommand(baseMsg);

            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                expect.stringContaining("Bot stopped"),
                { reply_markup: { remove_keyboard: true } }
            );
        });

        test("shows error on failure", async () => {
            const sendMessageSpy = jest
                .spyOn(bot, "sendMessage")
                .mockImplementationOnce(() => {
                    throw new Error("Telegram error");
                });

            await handler.handleStopCommand(baseMsg);

            expect(sendMessageSpy).toHaveBeenLastCalledWith(
                100,
                MENU_ITEM_ERROR
            );
        });
    });

    describe("handleViewListCommand()", () => {
        test("shows empty list message", async () => {
            userService.getOrCreateUser.mockResolvedValue(1);
            itemService.getItems.mockResolvedValue([]);

            await handler.handleViewListCommand(baseMsg);

            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                "🛍️ Your list is empty!",
                TELEGRAM_BOT_MAIN_MENU
            );
        });

        test("shows formatted list of items", async () => {
            userService.getOrCreateUser.mockResolvedValue(1);
            itemService.getItems.mockResolvedValue([
                { name: "Milk", bought: false },
                { name: "Bread", bought: true }
            ]);

            await handler.handleViewListCommand(baseMsg);

            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                expect.stringContaining("Milk"),
                expect.objectContaining({ parse_mode: "Markdown" })
            );
        });
    });

    describe("handleAddItemsCommand()", () => {
        test("sets ADDING_ITEMS mode and shows prompt", async () => {
            await handler.handleAddItemsCommand(baseMsg);

            expect(handler.userState.get(200)).toEqual({ mode: "ADDING_ITEMS" });
            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                expect.stringContaining("Send an item name"),
                TELEGRAM_BOT_ADD_ITEMS_MENU
            );
        });

        test("shows error on failure", async () => {
            const sendMessageSpy = jest
                .spyOn(bot, "sendMessage")
                .mockImplementationOnce(() => {
                    throw new Error("Telegram error");
                });

            await handler.handleAddItemsCommand(baseMsg);

            expect(sendMessageSpy).toHaveBeenLastCalledWith(
                100,
                MENU_ITEM_ERROR
            );
        });
    });

    describe("handleTextTypingCommand()", () => {
        test("adds item when in ADDING_ITEMS mode", async () => {
            handler.userState.set(200, { mode: "ADDING_ITEMS" });
            userService.getOrCreateUser.mockResolvedValue(1);
            itemService.addItem.mockResolvedValue();

            await handler.handleTextTypingCommand({
                ...baseMsg,
                text: "Milk"
            });

            expect(itemService.addItem).toHaveBeenCalledWith(1, "Milk");
            expect(bot.sendMessage).toHaveBeenCalled();
        });

        test("ignores input when not in ADDING_ITEMS mode", async () => {
            await handler.handleTextTypingCommand({
                ...baseMsg,
                text: "Milk"
            });

            expect(itemService.addItem).not.toHaveBeenCalled();
            expect(bot.sendMessage).not.toHaveBeenCalled();
        });

        test("shows error on failure", async () => {
            handler.userState.set(200, { mode: "ADDING_ITEMS" });

            userService.getOrCreateUser.mockResolvedValue(1);
            itemService.addItem.mockRejectedValue(
                new Error("DB error")
            );

            await handler.handleTextTypingCommand({
                ...baseMsg,
                text: "Milk"
            });

            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                MENU_ITEM_ERROR
            );
        });
    });

    describe("handleCancelAddItemsCommand()", () => {
        test("exits add mode and shows main menu", async () => {
            handler.userState.set(200, { mode: "ADDING_ITEMS" });
            userService.getOrCreateUser.mockResolvedValue(200);

            await handler.handleCancelAddItemsCommand(baseMsg);

            expect(handler.userState.has(200)).toBe(false);
            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                "✅ Add mode exited.",
                TELEGRAM_BOT_MAIN_MENU
            );
        });

        test("shows error on failure", async () => {
            const sendMessageSpy = jest
                .spyOn(bot, "sendMessage")
                .mockImplementationOnce(() => {
                    throw new Error("Telegram error");
                });

            await handler.handleCancelAddItemsCommand(baseMsg);

            expect(sendMessageSpy).toHaveBeenLastCalledWith(
                100,
                MENU_ITEM_ERROR
            );
        });
    });

    describe("handleMarkItemsBoughtCommand()", () => {
        test("shows message when no unbought items exist", async () => {
            userService.getOrCreateUser.mockResolvedValue(1);
            itemService.getUnboughtItems.mockResolvedValue([]);

            await handler.handleMarkItemsBoughtCommand(baseMsg);

            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                "🎉 All items already bought!",
                TELEGRAM_BOT_MAIN_MENU
            );
        });

        test("shows inline keyboard with items", async () => {
            userService.getOrCreateUser.mockResolvedValue(1);
            itemService.getUnboughtItems.mockResolvedValue([
                { id: 1, name: "Milk" }
            ]);

            await handler.handleMarkItemsBoughtCommand(baseMsg);

            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                "Select items:",
                expect.objectContaining({
                    reply_markup: {
                        inline_keyboard: [[
                            { text: "🛒 Milk", callback_data: "buy_1" }
                        ]]
                    }
                })
            );
        });
    });

    describe("handleMarkItemAsBoughtCallbackQuery()", () => {
        test("marks item as bought and updates button", async () => {
            itemService.markBought.mockResolvedValue();

            await handler.handleMarkItemAsBoughtCallbackQuery({
                id: "cb1",
                data: "buy_5",
                message: {
                    chat: { id: 100 },
                    message_id: 10,
                    reply_markup: {
                        inline_keyboard: [[
                            { text: "🛒 Milk", callback_data: "buy_5" },
                            { text: "🛒 Butter", callback_data: "buy_6" }
                        ]]
                    }
                }
            });

            expect(itemService.markBought).toHaveBeenCalledWith("5");
            expect(bot.editMessageReplyMarkup).toHaveBeenCalled();
        });

        test("handles disabled callback without updating DB", async () => {
            await handler.handleCallbackQuery({
                id: "cb1",
                data: "disabled",
                message: { chat: { id: 100 } }
            });

            expect(bot.answerCallbackQuery).toHaveBeenCalled();
            expect(itemService.markBought).not.toHaveBeenCalled();
        });
    });

    describe("handleDeleteItemCallbackQuery()", () => {
        test("handles disabled callback without updating DB", async () => {
            await handler.handleCallbackQuery({
                id: "cb1",
                data: "disabled",
                message: { chat: { id: 100 } }
            });

            expect(bot.answerCallbackQuery).toHaveBeenCalled();
            expect(itemService.markBought).not.toHaveBeenCalled();
        });

        test("deletes item and disables only clicked button", async () => {
            await handler.handleDeleteItemCallbackQuery({
                id: "cb1",
                data: "delete_1",
                message: {
                    chat: { id: 100 },
                    message_id: 10,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "🗑️ Milk", callback_data: "delete_1" }],
                            [{ text: "🗑️ Bread", callback_data: "delete_2" }]
                        ]
                    }
                }
            });

            expect(itemService.deleteItem).toHaveBeenCalledWith("1");

            expect(bot.editMessageReplyMarkup).toHaveBeenCalledWith(
                {
                    inline_keyboard: [
                        [{ text: "✅ Deleted", callback_data: "disabled" }],
                        [{ text: "🗑️ Bread", callback_data: "delete_2" }]
                    ]
                },
                {
                    chat_id: 100,
                    message_id: 10
                }
            );
        });
    });

    describe("handleDeleteItemsCommand()", () => {
        test("shows message when no unbought items exist", async () => {
            userService.getOrCreateUser.mockResolvedValue(1);
            itemService.getItems.mockResolvedValue([]);

            await handler.handleDeleteItemsCommand(baseMsg);

            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                "🛍️ Your list is empty!",
                TELEGRAM_BOT_MAIN_MENU
            );
        });

        test("shows inline keyboard with items", async () => {
            userService.getOrCreateUser.mockResolvedValue(1);
            itemService.getItems.mockResolvedValue([
                { id: 1, name: "Milk" }
            ]);

            await handler.handleDeleteItemsCommand(baseMsg);

            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                "Select items to delete:",
                expect.objectContaining({
                    reply_markup: {
                        inline_keyboard: [[
                            { text: "🗑️ Milk", callback_data: "delete_1" }
                        ]]
                    }
                })
            );
        });

        test("shows error on failure", async () => {
            userService.getOrCreateUser.mockRejectedValue(
                new Error("DB error")
            );

            await handler.handleDeleteItemsCommand(baseMsg);

            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                MENU_ITEM_ERROR
            );
        });
    });

    describe("handleMessageCommand()", () => {
        test("routes to handleViewListCommand", async () => {
            const spy = jest.spyOn(handler, "handleViewListCommand");

            await handler.handleMessageCommand({
                ...baseMsg,
                text: TELEGRAM_BOT_VIEW_LIST_MENU_ITEM
            });

            expect(spy).toHaveBeenCalled();
        });

        test("routes to handleAddItemsCommand", async () => {
            const spy = jest.spyOn(handler, "handleAddItemsCommand");

            await handler.handleMessageCommand({
                ...baseMsg,
                text: TELEGRAM_BOT_ADD_ITEMS_MENU_ITEM
            });

            expect(spy).toHaveBeenCalled();
        });

        test("routes to handleDeleteItemsCommand", async () => {
            const spy = jest.spyOn(handler, "handleDeleteItemsCommand");

            await handler.handleMessageCommand({
                ...baseMsg,
                text: TELEGRAM_BOT_DELETE_ITEMS_MENU_ITEM
            });

            expect(spy).toHaveBeenCalled();
        });

        test("routes random text to handleTextTypingCommand", async () => {
            const spy = jest.spyOn(handler, "handleTextTypingCommand");

            await handler.handleMessageCommand({
                ...baseMsg,
                text: "random text"
            });

            expect(spy).toHaveBeenCalled();
        });

        test("routes random text to handleCancelAddItemsCommand", async () => {
            const spy = jest.spyOn(handler, "handleCancelAddItemsCommand");

            await handler.handleMessageCommand({
                ...baseMsg,
                text: TELEGRAM_BOT_CANCEL_ADD_ITEMS_MENU_ITEM
            });

            expect(spy).toHaveBeenCalled();
        });

        test("routes random text to handleMarkItemsBoughtCommand", async () => {
            const spy = jest.spyOn(handler, "handleMarkItemsBoughtCommand");

            await handler.handleMessageCommand({
                ...baseMsg,
                text: TELEGRAM_BOT_CANCEL_MARK_ITEMS_BOUGHT_MENU_ITEM
            });

            expect(spy).toHaveBeenCalled();
        });

        test("shows error on failure", async () => {
            userService.getOrCreateUser.mockRejectedValue(
                new Error("DB error")
            );

            await handler.handleViewListCommand(baseMsg);

            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                MENU_ITEM_ERROR
            );
        });
    });

    describe("handleCallbackQuery() routing", () => {
        test("routes delete callback", async () => {
            const spy = jest.spyOn(handler, "handleDeleteItemCallbackQuery");

            await handler.handleCallbackQuery({
                id: "cb1",
                data: "delete_1",
                message: {
                    chat: { id: 100 },
                    reply_markup: { inline_keyboard: [] }
                }
            });

            expect(spy).toHaveBeenCalled();
        });

        test("routes buy callback", async () => {
            const spy = jest.spyOn(handler, "handleMarkItemAsBoughtCallbackQuery");

            await handler.handleCallbackQuery({
                id: "cb1",
                data: "buy_1",
                message: {
                    chat: { id: 100 },
                    reply_markup: { inline_keyboard: [] }
                }
            });

            expect(spy).toHaveBeenCalled();
        });

        test("shows error on failure", async () => {
            jest
                .spyOn(handler, "handleDeleteItemCallbackQuery")
                .mockRejectedValue(new Error("DB error"));

            await handler.handleCallbackQuery({
                id: "cb1",
                data: "delete_1",
                message: {
                    chat: { id: 100 },
                    from: { id: 200 },
                    reply_markup: { inline_keyboard: [] }
                }
            });

            expect(bot.sendMessage).toHaveBeenCalledWith(
                100,
                MENU_ITEM_ERROR
            );
        });
    });
});
