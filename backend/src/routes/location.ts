import { Router } from "express";
import { getLocation } from '../services/location.service.js'

const router = Router()
router.get('/', async(req, res) => {
    try {
        res.set('Cache-Control', 'no-store')
        const data = await getLocation(req.ip)
        res.status(200).json({data})
    } catch(error){
        return res.status(500).json({error: `${error}`})
    }
})

export default router 