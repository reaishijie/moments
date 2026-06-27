import { customAlphabet } from 'nanoid'
import nodemailer from "nodemailer"
import { prisma } from '../lib/prisma.js'
import { Logger } from '../utils/logger.js'

const logger = new Logger('MailService')
// 验证码字符表
const alphabet = '0123456789'
// 生成4位验证码
const code = customAlphabet(alphabet, 4)
// 导出生成方法，返回code、开始时间、过期时间
export function generateCode() {
  return {
    code: code(),
    createdAt: Date.now(),
    // 过期时间 60 秒
    expiresAt: Date.now() + 60 * 1000
  }
}
type MailConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === '') return fallback
  return value === 'true' || value === '1'
}

async function getMailConfig(): Promise<MailConfig> {
  const configs = await prisma.config.findMany({
    where: { k: { in: ['mail_host', 'mail_port', 'mail_secure', 'mail_user', 'mail_pass'] } },
    select: { k: true, v: true },
  })
  const configMap = configs.reduce((acc, current) => {
    acc[current.k] = current.v
    return acc
  }, {} as Record<string, string>)

  const host = configMap.mail_host || process.env.EMAIL_HOST || 'smtp.qq.com'
  const port = Number(configMap.mail_port || process.env.EMAIL_PORT || 465)
  const secure = parseBoolean(configMap.mail_secure || process.env.EMAIL_SECURE, true)
  const user = configMap.mail_user || process.env.EMAIL_USER || ''
  const pass = configMap.mail_pass || process.env.EMAIL_PASS || ''

  if (!user || !pass) {
    throw new Error('发件邮箱账号或授权码未配置，请在后台邮箱设置中填写 SMTP 邮箱账号和授权码')
  }

  return { host, port, secure, user, pass }
}

async function createTransporter() {
  const config = await getMailConfig()
  return {
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    }),
    from: config.user,
  }
}

// 通用邮件模板
function getEmailTemplate({
  subject,
  title,
  mainContent,
  ctaText, // 按钮文本，可选
  ctaLink // 按钮链接，可选
}: {
  subject: string;
  title: string;
  mainContent: string;
  ctaText?: string;
  ctaLink?: string;
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
      : ''
    }

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
export const emailStore = new Map<string, { code: string; createdAt: number; expiresAt: number }>()
// 解决异步带来的 竞态条件
const isSending = new Set<string>();

// 发送验证码的函数
export async function sendVerificationEmail(to: string) {
  // 判断时候在发送中
  if (isSending.has(to)) {
    logger.warn(`验证码正在发送中，请勿重复操作：${to}`)
    return false
  }

  // 判断是否过期
  if (emailStore.has(to) && Date.now() < emailStore.get(to)!.expiresAt) {
    logger.warn(`验证码发送频繁：${to}`)
    return false
  }
  // 发送邮件
  try {
    isSending.add(to)
    if (emailStore.has(to)) {
      logger.debug(`验证码已过期，删除旧码并准备发送新码：${to}`)
    }
    const codeObj = generateCode()
    const { transporter, from } = await createTransporter()

    // 验证码模板
    const verificationEmail = getEmailTemplate({
      subject: '您的验证码',
      title: '验证码',
      // 将验证码作为主要内容传入，并用 HTML 标签进行样式修饰
      mainContent: `
      您正在进行身份验证，请在 <span style="color:#0077b6;font-weight:bold;">60 秒</span> 内输入以下验证码完成操作：
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
      from: `"验证码服务" <${from}>`,
      to,                                       // 收件人
      subject: "您的验证码",                     // 邮件标题
      text: `您的验证码是 ${codeObj.code}，有效期 60 秒`, // 纯文本
      html: verificationEmail        // HTML 模板
    }
    // 发送邮件
    const info = await transporter.sendMail(mailOptions)

    emailStore.set(to, {
      code: codeObj.code,
      createdAt: codeObj.createdAt,
      expiresAt: codeObj.expiresAt,
    })
    logger.log(`邮件已发送：${info.messageId}`)
    return true
  } catch (error) {
    logger.error('邮件发送失败', error instanceof Error ? error.stack : String(error))
    return false;
  } finally {
    isSending.delete(to)
  }
}

// 清理过期验证码
setInterval(() => {
  const now = Date.now()
  for (const [email, data] of emailStore.entries()) {
    if (now > data.expiresAt) {
      emailStore.delete(email)
      logger.debug(`已清理过期验证码: ${email}`)
    }
  }
}, 10 * 60 * 1000)

interface verifyData {
  email: string
  code: string
}
// 验证输入的验证码是否正确
export function verify(data: verifyData) {
  const { email, code } = data
  const record = emailStore.get(email)
  if (!record) return false

  if (Date.now() > record.expiresAt) {
    emailStore.delete(email)
    return false
  }

  return record.code === code
}

// 验证并消费验证码，避免同一个验证码被重复用于注册、登录或重置密码
export function verifyAndConsume(data: verifyData) {
  const isValid = verify(data)
  if (isValid) {
    emailStore.delete(data.email)
  }
  return isValid
}