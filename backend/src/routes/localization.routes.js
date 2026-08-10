import { Router } from 'express';
import { show } from '../controllers/localization.controller.js';

const router = Router();

router.get('/', show);

export default router;
