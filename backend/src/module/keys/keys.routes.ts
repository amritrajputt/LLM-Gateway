import express from 'express';
import { validate } from '../../common/dto/dto';
import { keysSchema } from './keys.dto';
import { KeysController } from './keys.controller';
const keysRouter = express.Router();
keysRouter.post('/addapikey',validate(keysSchema),KeysController.createKey);

export { keysRouter };