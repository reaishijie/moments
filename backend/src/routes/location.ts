import { Router } from "express";
import { getLocation } from '../services/location.service'

const router = Router()
router.use('/getLocation', async(req, res) => {
    try {
        const data = await getLocation()
        console.log(data);
        res.status(200).json({data})
    } catch(error){
        console.log("src\routes\index.ts Error", error)
        return res.status(500).json({error: 'error'})
    }
})

export default router 