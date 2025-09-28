var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from "express";
import { sendVerificationEmail, verify } from "../services/mail.service.js";
import { verifyHcaptcha } from "../services/verify.service.js";
const router = Router();
router.post('/sendEmail', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield sendVerificationEmail(req.body.email);
        if (result) {
            res.status(200).json({ status: true, message: "发送成功" });
            return;
        }
        res.status(400).json({ status: false, message: "发送失败" });
    }
    catch (error) {
        console.error('发送邮件失败：', error);
        res.status(400).json({ status: false, message: "发送失败" });
    }
}));
router.post('/verifyEmail', (req, res) => {
    const data = req.body;
    try {
        const result = verify(data);
        console.log('结果布尔值：', result);
        if (result) {
            res.status(200).json({ status: true, message: "验证成功" });
            return;
        }
        res.status(400).json({ status: false, message: "验证失败" });
    }
    catch (error) {
        console.error('验证失败：', error);
        res.status(400).json({ status: false, message: "验证失败" });
    }
});
router.post('/hcaptcha', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { captchaToken } = req.body;
    if (!captchaToken) {
        return res.status(400).json({ status: false, message: '人机验证令牌缺失' });
    }
    try {
        const isVerified = yield verifyHcaptcha(captchaToken);
        if (isVerified) {
            return res.status(200).json({ status: true, message: "验证成功" });
        }
        else {
            return res.status(400).json({ status: false, message: "验证失败" });
        }
    }
    catch (error) {
        console.error('路由处理错误：', error);
        return res.status(500).json({ status: false, message: '服务器内部错误' });
    }
}));
export default router;
