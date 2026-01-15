import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { UserCacheService } from "../userCache.service.js";

describe("UserCacheService", () => {
    let cache;
    let userService;
    let service;

    beforeEach(() => {
        cache = {
            get: jest.fn(),
            set: jest.fn()
        };

        userService = {
            getOrCreateUser: jest.fn()
        };

        service = new UserCacheService(userService, cache);
    });

    test("returns userId from cache when present", async () => {
        cache.get.mockResolvedValue({
            value: Buffer.from("42")
        });

        const result = await service.getUserId(123);

        expect(result).toBe(42);
        expect(userService.getOrCreateUser).not.toHaveBeenCalled();
        expect(cache.set).not.toHaveBeenCalled();
    });

    test("falls back to DB on cache miss", async () => {
        cache.get.mockResolvedValue(null);
        userService.getOrCreateUser.mockResolvedValue(7);

        const result = await service.getUserId(555);

        expect(result).toBe(7);
        expect(userService.getOrCreateUser).toHaveBeenCalledWith(555);
        expect(cache.set).toHaveBeenCalledWith(
            "user:555",
            "7",
            expect.objectContaining({ expires: 3600 })
        );
    });
});
