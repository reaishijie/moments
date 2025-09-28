var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { customAlphabet } from 'nanoid';
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();
// 验证码字符表
const alphabet = '0123456789';
// 生成4位验证码
const code = customAlphabet(alphabet, 4);
// 导出生成方法，返回code、开始时间、过期时间
export function generateCode() {
    return {
        code: code(),
        createdAt: Date.now(),
        // 过期时间 5分钟
        expiresAt: Date.now() + 5 * 60 * 1000
    };
}
// 邮件传输器
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.qq.com",
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: Boolean(process.env.EMAIL_SECURE) || true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
// 通用邮件模板
function getEmailTemplate({ subject, title, mainContent, ctaText, // 按钮文本，可选
ctaLink // 按钮链接，可选
 }) {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${subject}</title>
      </head>
      <body style="margin:0;padding:0;background:#f6f9fc;font-family:Segoe UI,Arial,sans-serif;">
        <table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:40px;text-align:center;">
              <h1 style="color:#0077b6;margin-bottom:20px;">${title}</h1>
              <p style="font-size:16px;color:#333;margin-bottom:30px;">
                ${mainContent}
              </p>

              ${
    // 如果提供了按钮文本和链接，就渲染一个按钮
    ctaText && ctaLink
        ? `<div style="margin:20px 0;">
                    <a href="${ctaLink}" style="background-color:#00b4d8;color:#ffffff;padding:12px 24px;border-radius:5px;text-decoration:none;font-weight:bold;display:inline-block;">
                      ${ctaText}
                    </a>
                  </div>`
        : ''}

              <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
              <p style="font-size:12px;color:#aaa;">
                本邮件由系统自动发送，请勿直接回复。
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
// 注册模板
const registrationEmail = getEmailTemplate({
    subject: '欢迎加入！',
    title: '恭喜您，注册成功！',
    mainContent: `感谢您加入我们的社区。您现在可以登录并开始使用我们的服务。`,
    ctaText: '立即登录',
    ctaLink: 'https://example.com/login'
});
// 评论通知模板
const newCommentEmail = getEmailTemplate({
    subject: '您有新评论',
    title: '您发布的文章收到了新评论',
    mainContent: `您好，您的文章“如何构建通用邮件模板”收到了新评论。`,
    ctaText: '查看评论',
    ctaLink: 'https://example.com/article/123#comment'
});
// 存储验证码
export const emailStore = new Map();
// 解决异步带来的 竞态条件
const isSending = new Set();
// 发送验证码的函数
export function sendVerificationEmail(to) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('@函数开始, emailStore', emailStore);
        // 判断时候在发送中
        if (isSending.has(to)) {
            console.log("已经在发送中，请勿重复操作：", to);
            return false;
        }
        // 判断是否过期
        if (emailStore.has(to) && Date.now() < emailStore.get(to).expiresAt) {
            console.log("发送频繁", to);
            return false;
        }
        // 发送邮件
        try {
            isSending.add(to);
            if (emailStore.has(to)) {
                console.log("验证码已过期，删除旧码并准备发送新码", to);
            }
            const codeObj = generateCode();
            // 验证码模板
            const verificationEmail = getEmailTemplate({
                subject: '您的验证码',
                title: '验证码',
                // 将验证码作为主要内容传入，并用 HTML 标签进行样式修饰
                mainContent: `
      您正在进行身份验证，请在 <span style="color:#0077b6;font-weight:bold;">5 分钟</span> 内输入以下验证码完成操作：
      <div style="font-size:32px;letter-spacing:10px;font-weight:bold;color:#00b4d8;margin:20px 0;">
        ${codeObj.code}
      </div>
      <p style="font-size:14px;color:#666;margin-top:30px;">
        如果这不是您的操作，请忽略此邮件。
      </p>
    `,
            });
            // 邮件模板
            const mailOptions = {
                from: `"验证码服务" <${process.env.EMAIL_USER}>`,
                to, // 收件人
                subject: "您的验证码", // 邮件标题
                text: `您的验证码是 ${codeObj.code}，有效期 5 分钟`, // 纯文本
                html: verificationEmail // HTML 模板
            };
            // 发送邮件
            const info = yield transporter.sendMail(mailOptions);
            emailStore.set(to, {
                code: codeObj.code,
                createdAt: codeObj.createdAt,
                expiresAt: codeObj.expiresAt,
            });
            console.log("✅ 邮件已发送:", info.messageId);
            // console.log("✅ 邮件已发送")
            return true;
        }
        catch (error) {
            console.error("邮件发送失败:", error);
            return false;
        }
        finally {
            isSending.delete(to);
        }
    });
}
// 清理过期验证码
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of emailStore.entries()) {
        if (now > data.expiresAt) {
            emailStore.delete(email);
            console.log(`已清理过期验证码: ${email}`);
        }
    }
}, 10 * 60 * 1000);
// 验证输入的验证码是否正确
export function verify(data) {
    const { email, code } = data;
    // 判断是否存在邮箱
    if (emailStore.has(data.email)) {
        if (emailStore.get(data.email).code === data.code) {
            return true;
        }
        return false;
    }
    return false;
}
