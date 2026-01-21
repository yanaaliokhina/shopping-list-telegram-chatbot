# 🛒 Telegram Shopping List Bot

A lightweight, user-friendly Telegram chatbot that helps users manage their shopping lists efficiently.
The bot supports adding, viewing, deleting, and marking items as bought, with a clean UX and scalable backend architecture.

<img width="300" height="450" alt="start_view_items" padding="20px" src="https://github.com/user-attachments/assets/e246404b-0181-442f-941a-15635c3a2c08" />
<img width="300" height="450" alt="add_items_0" src="https://github.com/user-attachments/assets/3528bcc9-4c56-450d-b684-7302b7ef2d3f" />
<img width="300" height="450" alt="stop_bot" src="https://github.com/user-attachments/assets/d6b64ab2-b2dd-41dd-9572-743b77347073" />


## System requirements

* Node.js >= 18.x
* npm >= 9.x
* Telegram account
* Telegram Bot Token (via @BotFather)


## 🧩 Core Components

1. **Handlers**

* Handle Telegram updates (messages & callback queries)
* Manage user interaction and UX
* Never access the database directly


2. **Services**

* Contain business logic
* Coordinate repositories and caching
* Easy to unit test


3. **Repositories**

* Execute SQL queries
* Encapsulate database access
* No Telegram or UI logic


4. **Cache Layer**

* Stores telegram_id → user_id mappings
* Uses Memcached with 1-hour TTL
* Best-effort: failures never block user actions


## Supported Functionality

1. **➕ Add Items**

* Users can add one or multiple items
* Items are added incrementally without reopening the menu
* Clean confirmation after each item


2. **📋 View List**

* Displays all shopping list items
* Clearly indicates bought vs unbought items
* Uses emojis for clarity and readability


3. **🗑️ Delete Items**

* Displays items as inline buttons
* Supports deleting multiple items
* Deleted items are visually disabled in the UI


4. **✅ Mark as Bought**

* Items can be marked as bought individually
* Button is updated and disabled after successful action
* Remaining items stay interactive



## 🚀 How to Run Locally (Without Docker)

Prerequisites
* Node.js >= 18.x
* SQLite installed
* Telegram Bot Token

### Step 1 - Install dependencies

```
npm install
```

### Step 2 - Configure environment variables

Create a .env file:
```
TELEGRAM_BOT_TOKEN=your_telegram_TELEGRAM_BOT_TOKEN
DATABASE_PATH=./data/shopping.db
MEMCACHE_URL=localhost:11211
```

⚠️ Never commit .env to version control

### Step 3 -  Run the bot

```
npm run start
```


## 🐳 How to Run Locally with Docker (Recommended)

Prerequisites
* Docker
* Docker Compose

### Step 1 - Configure environment variables

Create a .env file:
```
TELEGRAM_BOT_TOKEN=your_telegram_bot
```


### Step 2 - Start services

```
docker compose up --build
```

This will start:
* Telegram bot service
* Memcached service
* SQLite database (persisted via volume)


### Stop services

```
docker compose down
```


## 🧪 Running Tests

Two options:
```
npm run test
npm run test:coverage
```
