type LogLevel = 'info' | 'warn' | 'error' | 'debug'

class Logger {
  private isDev = import.meta.env.DEV

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.isDev && level === 'debug') return
    
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (data) {
      console[level === 'debug' ? 'log' : level](`${prefix} ${message}`, data)
    } else {
      console[level === 'debug' ? 'log' : level](`${prefix} ${message}`)
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }
}

export const logger = new Logger()
