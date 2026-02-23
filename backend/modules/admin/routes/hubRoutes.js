import express from 'express';
import {
    getHubs,
    createHub,
    updateHub,
    deleteHub
} from '../controllers/hubController.js';

const router = express.Router();

router.get('/', getHubs);
router.post('/', createHub);
router.put('/:id', updateHub);
router.delete('/:id', deleteHub);

export default router;
