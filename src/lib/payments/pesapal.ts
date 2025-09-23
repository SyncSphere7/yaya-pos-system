export interface PesapalConfig {
  consumerKey: string
  consumerSecret: string
  apiUrl: string
  environment: 'sandbox' | 'production'
}

export interface PaymentRequest {
  id: string
  currency: 'UGX' | 'USD' | 'KES'
  amount: number
  description: string
  callback_url: string
  notification_id?: string
  billing_address: {
    email_address: string
    phone_number?: string
    country_code: string
    first_name: string
    last_name: string
    line_1?: string
    line_2?: string
    city?: string
    state?: string
    postal_code?: string
    zip_code?: string
  }
}

export interface PaymentResponse {
  order_tracking_id: string
  merchant_reference: string
  redirect_url: string
  error?: {
    type: string
    code: string
    message: string
    call_id: string
  }
}

export interface PaymentStatus {
  payment_method: string
  amount: number
  created_date: string
  confirmation_code: string
  payment_status_description: string
  description: string
  message: string
  payment_account: string
  call_id: string
  status_code: number
  merchant_reference: string
  payment_status_code: string
  currency: string
}

export class PesapalPaymentGateway {
  private config: PesapalConfig
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor(config: PesapalConfig) {
    this.config = config
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/api/Auth/RequestToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          consumer_key: this.config.consumerKey,
          consumer_secret: this.config.consumerSecret
        })
      })

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`Authentication error: ${data.error.message}`)
      }

      this.accessToken = data.token
      // Tokens typically expire after 5 minutes, set expiry to 4 minutes to be safe
      this.tokenExpiry = new Date(Date.now() + 4 * 60 * 1000)
      
      return this.accessToken
    } catch (error) {
      throw new Error(`Failed to obtain access token: ${error}`)
    }
  }

  async submitOrderRequest(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.config.apiUrl}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        throw new Error(`Payment request failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`Payment error: ${data.error.message}`)
      }

      return data
    } catch (error) {
      throw new Error(`Failed to submit payment request: ${error}`)
    }
  }

  async getTransactionStatus(orderTrackingId: string): Promise<PaymentStatus> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(
        `${this.config.apiUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`Status error: ${data.error.message}`)
      }

      return data
    } catch (error) {
      throw new Error(`Failed to get transaction status: ${error}`)
    }
  }

  async registerIPN(url: string, ipn_notification_type: 'GET' | 'POST' = 'POST'): Promise<any> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.config.apiUrl}/api/URLSetup/RegisterIPN`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          url,
          ipn_notification_type
        })
      })

      if (!response.ok) {
        throw new Error(`IPN registration failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`IPN error: ${data.error.message}`)
      }

      return data
    } catch (error) {
      throw new Error(`Failed to register IPN: ${error}`)
    }
  }

  // Helper method to validate payment status
  isPaymentSuccessful(status: PaymentStatus): boolean {
    return status.payment_status_code === '1' || status.payment_status_description.toLowerCase() === 'completed'
  }

  // Helper method to validate payment is pending
  isPaymentPending(status: PaymentStatus): boolean {
    return status.payment_status_code === '0' || status.payment_status_description.toLowerCase() === 'pending'
  }

  // Helper method to validate payment failed
  isPaymentFailed(status: PaymentStatus): boolean {
    return status.payment_status_code === '2' || status.payment_status_description.toLowerCase() === 'failed'
  }
}

// Singleton instance for the application
let pesapalInstance: PesapalPaymentGateway | null = null

export function getPesapalInstance(): PesapalPaymentGateway {
  if (!pesapalInstance) {
    const config: PesapalConfig = {
      consumerKey: process.env.PESAPAL_CONSUMER_KEY || '',
      consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || '',
      apiUrl: process.env.PESAPAL_API_URL || 'https://pay.pesapal.com/v3',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    }

    pesapalInstance = new PesapalPaymentGateway(config)
  }

  return pesapalInstance
}

// Payment method types supported
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MTN_MOMO: 'mtn_momo',
  AIRTEL_PAY: 'airtel_pay',
  PESAPAL: 'pesapal'
} as const

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]
