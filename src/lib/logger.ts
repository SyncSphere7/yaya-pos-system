type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
  userId?: string
  sessionId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel = process.env.LOG_LEVEL || 'info'

  private shouldLog(level: LogLevel): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level] >= levels[this.logLevel as LogLevel]
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, error, userId, sessionId } = entry
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    
    if (userId) logMessage += ` | User: ${userId}`
    if (sessionId) logMessage += ` | Session: ${sessionId}`
    if (context) logMessage += ` | Context: ${JSON.stringify(context)}`
    if (error) logMessage += ` | Error: ${error.message}\n${error.stack}`
    
    return logMessage
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    context?: Record<string, any>,
    error?: Error,
    userId?: string,
    sessionId?: string
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      userId,
      sessionId
    }
  }

  info(message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    if (!this.shouldLog('info')) return
    
    const entry = this.createLogEntry('info', message, context, undefined, userId, sessionId)
    
    if (this.isDevelopment) {
      console.log(this.formatLog(entry))
    } else {
      // In production, send to logging service
      this.sendToLoggingService(entry)
    }
  }

  warn(message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    if (!this.shouldLog('warn')) return
    
    const entry = this.createLogEntry('warn', message, context, undefined, userId, sessionId)
    
    if (this.isDevelopment) {
      console.warn(this.formatLog(entry))
    } else {
      this.sendToLoggingService(entry)
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>, userId?: string, sessionId?: string) {
    if (!this.shouldLog('error')) return
    
    const entry = this.createLogEntry('error', message, context, error, userId, sessionId)
    
    if (this.isDevelopment) {
      console.error(this.formatLog(entry))
    } else {
      this.sendToLoggingService(entry)
    }
  }

  debug(message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    if (!this.shouldLog('debug')) return
    
    const entry = this.createLogEntry('debug', message, context, undefined, userId, sessionId)
    
    if (this.isDevelopment) {
      console.debug(this.formatLog(entry))
    } else {
      this.sendToLoggingService(entry)
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    try {
      // In production, you would send logs to a service like:
      // - Sentry for error tracking
      // - CloudWatch for AWS
      // - Google Cloud Logging
      // - Custom logging endpoint
      
      // For now, we'll store in local storage or send to an endpoint
      if (typeof window !== 'undefined') {
        // Client-side logging
        const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
        logs.push(entry)
        
        // Keep only last 100 logs
        if (logs.length > 100) {
          logs.splice(0, logs.length - 100)
        }
        
        localStorage.setItem('app_logs', JSON.stringify(logs))
      } else {
        // Server-side logging - could send to external service
        console.log(this.formatLog(entry))
      }
    } catch (logError) {
      console.error('Failed to send log to service:', logError)
    }
  }

  // Method to retrieve logs (useful for debugging)
  getLogs(): LogEntry[] {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('app_logs') || '[]')
    }
    return []
  }

  // Method to clear logs
  clearLogs(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app_logs')
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Utility functions for common logging scenarios
export const logUserAction = (action: string, userId: string, context?: Record<string, any>) => {
  logger.info(`User action: ${action}`, context, userId)
}

export const logError = (error: Error, context?: Record<string, any>, userId?: string) => {
  logger.error('Application error', error, context, userId)
}

export const logApiCall = (endpoint: string, method: string, statusCode: number, userId?: string) => {
  logger.info(`API call: ${method} ${endpoint}`, { statusCode }, userId)
}

export const logPayment = (orderId: string, amount: number, method: string, status: string, userId?: string) => {
  logger.info('Payment processed', { orderId, amount, method, status }, userId)
}