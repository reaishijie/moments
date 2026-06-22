// Terminal color ANSI escape codes
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
}

export type LogLevel = 'LOG' | 'WARN' | 'ERROR' | 'DEBUG'

export interface LoggerOptions {
  appName?: string
  colors?: boolean
  timestampLocale?: string
}

export class Logger {
  private context: string
  private appName: string
  private enableColors: boolean
  private timestampLocale: string

  constructor(context: string, options: LoggerOptions = {}) {
    this.context = context
    this.appName = options.appName ?? 'Moments'
    this.enableColors = options.colors ?? true
    this.timestampLocale = options.timestampLocale ?? 'zh-CN'
  }

  private color(value: string, color: string): string {
    if (!this.enableColors) {
      return value
    }

    return `${color}${value}${colors.reset}`
  }

  private getTimestamp(): string {
    return new Date().toLocaleString(this.timestampLocale, { hour12: false })
  }

  private getPid(): string | number {
    return globalThis.process?.pid ?? '-'
  }

  private print(level: LogLevel, message: string, color: string) {
    const prefix = this.color(`[${this.appName}] ${this.getPid()}  -`, colors.green)
    const timeStr = this.getTimestamp()
    const levelStr = this.color(level.padEnd(7), color)
    const contextStr = this.color(`[${this.context}]`, colors.yellow)
    const msgStr = this.color(message, color)

    console.log(`${prefix} ${timeStr}     ${levelStr} ${contextStr} ${msgStr}`)
  }

  log(message: string) {
    this.print('LOG', message, colors.green)
  }

  warn(message: string) {
    this.print('WARN', message, colors.yellow)
  }

  error(message: string, trace?: string) {
    this.print('ERROR', message, colors.red)

    if (trace) {
      console.error(this.color(trace, colors.red))
    }
  }

  debug(message: string) {
    this.print('DEBUG', message, colors.cyan)
  }
}
