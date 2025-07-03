import express from 'express';
import * as roleController from '../../controllers/settings/roleController.js';

const router = express.Router();

router.get('/', roleController.getAll);
router.get('/:id', roleController.getRoleById);
router.post('/', roleController.create);
router.put('/:id', roleController.update);
router.delete('/:id', roleController.remove);

export default router; 