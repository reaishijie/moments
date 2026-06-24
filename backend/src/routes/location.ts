import { Router } from "express";
import { getLocation, getPreferredClientIp } from '../services/location.service.js'

const router = Router()
router.get('/', async(req, res) => {
    try {
        res.set('Cache-Control', 'no-store')
        const clientIp = getPreferredClientIp([
            req.headers['x-forwarded-for'],
            req.headers['x-real-ip'],
            req.headers['cf-connecting-ip'],
            req.ip,
        ])
        const data = await getLocation(clientIp)
        res.status(200).json({data})
    } catch(error){
        return res.status(500).json({error: `${error}`})
    }
})

export default router 