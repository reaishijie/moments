/** 邮箱格式校验，多处表单复用 */
export function isValidEmail(email?: string) {
  return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
