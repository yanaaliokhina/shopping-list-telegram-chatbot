# Smart Shopping List Chatbot

## System requirements

* Node.js >= 18.x
* npm >= 9.x
* Telegram account
* Telegram Bot Token (via @BotFather)

## Environment Configuration

```
BOT_TOKEN=your_telegram_bot_token
NODE_ENV=development
DATABASE_PATH=./shopping.db
MEMCACHE_URL=localhost:11211
```

⚠️ Never commit ```.env``` to version control

## How to Run Locally

```
npm install
docker-compose up --build -d
npm start
```

## How to Run Tests

```
npm run test
npm run test:coverage
```