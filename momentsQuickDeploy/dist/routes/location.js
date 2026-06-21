import { Router } from "express";
import { location } from '../services/location.service.js';
const router = Router();
router.get('/', async (req, res) => {
    try {
        const data = await location();
        res.status(200).json({ data });
    }
    catch (error) {
        return res.status(500).json({ error: `${error}` });
    }
});
export default router;
