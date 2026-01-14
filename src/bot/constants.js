export const TELEGRAM_BOT_VIEW_LIST_MENU_ITEM = "📋 View List";

export const TELEGRAM_BOT_ADD_ITEMS_MENU_ITEM = "➕ Add Items";

export const TELEGRAM_BOT_CANCEL_ADD_ITEMS_MENU_ITEM = "❌ Cancel";

export const TELEGRAM_BOT_MAIN_MENU = {
  reply_markup: {
    keyboard: [
      [TELEGRAM_BOT_VIEW_LIST_MENU_ITEM],
      [TELEGRAM_BOT_ADD_ITEMS_MENU_ITEM]
    ],
    resize_keyboard: true
  }
};

export const TELEGRAM_BOT_ADD_ITEMS_MENU = {
  reply_markup: {
    keyboard: [[TELEGRAM_BOT_CANCEL_ADD_ITEMS_MENU_ITEM]],
    resize_keyboard: true
  }
};
