import { Router } from "express";
import { ProvidersController } from "./providers.controller";

export const providersRouter = Router();
providersRouter.get("/", ProvidersController.list);
