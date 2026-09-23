import { Redis } from "ioredis";
import { redisClient } from "../../redis/client";

const downModels = async (models: string) => {
    await redisClient.sadd("down_models", models);
} 

