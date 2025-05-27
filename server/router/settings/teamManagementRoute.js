import express from 'express';
import * as teamController from '../../controllers/settings/teamController.js';

const router = express.Router();

router.get('/', teamController.getAll);
router.post('/', teamController.create);
router.delete('/:id', teamController.deleteMember);

export default router;