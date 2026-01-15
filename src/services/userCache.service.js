const ONE_HOUR_TTL = 60 * 60;

export class UserCacheService {

    constructor(userService, cacheClient) {
        this.userService = userService;
        this.cache = cacheClient;
    }

    async getUserId(telegramId) {
        const cacheKey = `user:${telegramId}`;

        const cached = await this.cache.get(cacheKey);
        if (cached?.value) {
            return Number(cached.value.toString());
        }

        const userId = await this.userService.getOrCreateUser(telegramId);

        await this.cache.set(
            cacheKey,
            String(userId),
            { expires: ONE_HOUR_TTL }
        );

        return userId;
    }
}
