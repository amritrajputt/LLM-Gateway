import { Redis } from "ioredis";
import { redisClient } from "../../redis/client";

export const downModel = async (model: string) => {
    await redisClient.sadd("down_models", model);
} 

export const getDownModels = async (): Promise<string[]> => {
    return redisClient.smembers("down_models");
}
