import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = Router();
const prisma = new PrismaClient();
// 添加友情链接
router.post('', authMiddleware, async (req, res) => {
    const { logo, sitename, brief, url } = req.body;
    const user = req.user;
    // 管理员直接发布，用户申请需审核
    const status = user?.role === 1 ? 1 : 0;
    try {
        const result = await prisma.link.create({
            data: {
                logo: logo,
                sitename: sitename,
                brief: brief,
                url: url,
                status: status,
            }
        });
        res.status(200).json({ status: true, message: 'success', link_status: status });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ status: false, error: error });
    }
});
// 获取友情链接
router.get('', async (req, res) => {
    try {
        const links = await prisma.link.findMany({
            where: {
                status: 1,
                deleted_at: null
            },
            orderBy: {
                created_at: 'asc'
            }
        });
        const responseData = links.map(l => ({
            ...l,
            id: l.id.toString()
        }));
        res.status(200).json(responseData);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ status: false, error: error });
    }
});
export default router;
