import { Router } from "express";
import { validate } from "../../common/dto/dto";
import { modelSchema } from "./model.dto";
import { modelController } from "./model.controller";

export const modelRouter = Router();
modelRouter.post("/addmodel", validate(modelSchema), modelController.create);