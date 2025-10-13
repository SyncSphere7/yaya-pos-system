/**
 * Pesapal Payment Gateway Integration
 * Supports: Cash, Airtel Money, MTN Mobile Money, Card (POS Terminal)
 * Live Production Environment
 */

const PESAPAL_IPN_ID = process.env.PESAPAL_IPN_ID

interface PesapalAuthResponse {
  token: string
  expiryDate: string
  error?: string
  message?: string
}

interface PesapalPaymentRequest {
  id: string // Merchant reference (order ID)
  currency: string
  amount: number
  description: string
  callback_url: string
  notification_id: string
  billing_address: {
    phone_number: string
    email_address?: string
    country_code?: string
    first_name?: string
    middle_name?: string
    last_name?: string
    line_1?: string
    line_2?: string
    city?: string
    state?: string
    postal_code?: string
    zip_code?: string
  }
}

interface PesapalPaymentResponse {
  order_tracking_id: string
  merchant_reference: string
  redirect_url?: string
  error?: string
  message?: string
  status?: number
}

interface PesapalTransactionStatus {
  payment_method: string
  amount: number
  created_date: string
  confirmation_code: string
  payment_status_description: string
  description: string
  message: string
  payment_account: string
  call_back_url: string
  status_code: number
  merchant_reference: string
  payment_status_code: string
  currency: string
  error?: {
    error_type: string
    code: string
    message: string
    call_back_url: string
  }
}

/**
 * Get Pesapal authentication token
 */
export async function getPesapalToken(): Promise<string> {
  try {
    const response = await fetch(`${PESAPAL_API_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
      }),
    })

    const data: PesapalAuthResponse = await response.json()

    if (data.error || !data.token) {
      throw new Error(data.message || 'Failed to get Pesapal token')
    }

    return data.token
  } catch (error) {
    console.error('Pesapal auth error:', error)
    throw new Error('Failed to authenticate with Pesapal')
  }
}

/**
 * Register IPN (Instant Payment Notification) URL
 */
export async function registerIPNUrl(ipnUrl: string): Promise<string> {
  try {
    const token = await getPesapalToken()

    const response = await fetch(`${PESAPAL_API_URL}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: 'GET',
      }),
    })

    const data = await response.json()

    if (data.error || !data.ipn_id) {
      throw new Error(data.message || 'Failed to register IPN URL')
    }

    return data.ipn_id
  } catch (error) {
    console.error('IPN registration error:', error)
    throw new Error('Failed to register IPN URL')
  }
}

/**
 * Initiate mobile money payment (Airtel Money or MTN MoMo)
 * Sends STK Push to customer's phone
 */
export async function initiateMobileMoneyPayment(params: {
  orderId: string
  amount: number
  phoneNumber: string
  paymentMethod: 'airtel_money' | 'mtn_momo'
  description: string
  callbackUrl: string
  notificationId: string
}): Promise<PesapalPaymentResponse> {
  try {
    const token = await getPesapalToken()

    const paymentRequest: PesapalPaymentRequest = {
      id: params.orderId,
      currency: 'UGX',
      amount: params.amount,
      description: params.description,
      callback_url: params.callbackUrl,
      notification_id: params.notificationId,
      billing_address: {
        phone_number: params.phoneNumber,
        country_code: 'UG',
      },
    }

    const response = await fetch(`${PESAPAL_API_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentRequest),
    })

    const data: PesapalPaymentResponse = await response.json()

    if (data.error) {
      throw new Error(data.message || 'Failed to initiate payment')
    }

    return data
  } catch (error) {
    console.error('Mobile money payment error:', error)
    throw new Error('Failed to initiate mobile money payment')
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
  try {
    const token = await getPesapalToken()

    const response = await fetch(
      `${PESAPAL_API_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data: PesapalTransactionStatus = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'Failed to check payment status')
    }

    return data
  } catch (error) {
    console.error('Payment status check error:', error)
    throw new Error('Failed to check payment status')
  }
}

/**
 * Helper to format phone number for Uganda
 */
export function formatUgandaPhone(phone: string): string {
  // Remove any spaces, dashes, or parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '')

  // Remove leading + or 256
  if (cleaned.startsWith('+256')) {
    cleaned = cleaned.substring(4)
  } else if (cleaned.startsWith('256')) {
    cleaned = cleaned.substring(3)
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }

  // Should be 9 digits (like 775123456)
  if (cleaned.length !== 9) {
    throw new Error('Invalid phone number format. Should be 10 digits starting with 0 or 9 digits without 0.')
  }

  // Add country code
  return `+256${cleaned}`
}

/**
 * Validate payment method matches phone number prefix
 */
export function validatePaymentMethod(phone: string, method: 'airtel_money' | 'mtn_momo'): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  const lastNineDigits = cleaned.slice(-9)
  const firstDigit = lastNineDigits[0]

  if (method === 'airtel_money') {
    // Airtel numbers start with 70, 75
    return firstDigit === '7' && (lastNineDigits[1] === '0' || lastNineDigits[1] === '5')
  } else if (method === 'mtn_momo') {
    // MTN numbers start with 77, 78, 76
    return (
      firstDigit === '7' &&
      (lastNineDigits[1] === '7' || lastNineDigits[1] === '8' || lastNineDigits[1] === '6')
    )
  }

  return false
}
