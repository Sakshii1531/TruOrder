import express from 'express';
import {
    getCities,
    createCity,
    updateCity,
    deleteCity
} from '../controllers/cityController.js';

const router = express.Router();

router.get('/', getCities);
router.post('/', createCity);
router.put('/:id', updateCity);
router.delete('/:id', deleteCity);

export default router;
