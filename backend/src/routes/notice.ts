import { Router, Request, Response } from "express";
import { sendVerificationEmail, verify } from "../services/mail.service.js";

const router = Router()

router.post('/sendEmail', async(req: Request, res: Response) => {
    try {
        const result = await sendVerificationEmail(req.body.email)
        if(result) {
            res.status(200).json({status: true, message: "发送成功"})
            return
        }
        res.status(400).json({status: false, message: "发送失败"})
    } catch (error) {
        console.error('发送邮件失败：', error);
        res.status(400).json({status: false, message: "发送失败"})
    }
})

router.post('/verifyEmail', (req: Request, res: Response) => {
    const data = req.body
    console.log("req.body & req.body.data", req.body, req.body.data);
    
    try {
        const result = verify(data)
        console.log('结果布尔值：', result);
        if(result) {
            res.status(200).json({status: true, message: "验证成功"})
            return
        }
        res.status(400).json({status: false, message: "验证失败"})
    } catch (error) {
        console.error('验证失败：', error);
        res.status(400).json({status: false, message: "验证失败"})
    }
})

export default router