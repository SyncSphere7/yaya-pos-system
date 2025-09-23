'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  Payment as PaymentIcon,
  Money as CashIcon,
  CreditCard as CardIcon,
  Phone as MobileIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getPesapalInstance } from '@/lib/payments/pesapal'

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  orderId: string
  amount: number
  onPaymentComplete: () => void
}

type PaymentMethod = 'cash' | 'card' | 'mtn_momo' | 'airtel_pay'

export function PaymentDialog({ open, onClose, orderId, amount, onPaymentComplete }: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [cashReceived, setCashReceived] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: <CashIcon />, color: 'success' },
    { id: 'card', name: 'Card', icon: <CardIcon />, color: 'primary' },
    { id: 'mtn_momo', name: 'MTN MoMo', icon: <MobileIcon />, color: 'warning' },
    { id: 'airtel_pay', name: 'AirtelPay', icon: <MobileIcon />, color: 'error' }
  ]

  const handlePayment = async () => {
    setIsProcessing(true)
    setError('')

    try {
      if (selectedMethod === 'cash') {
        await processCashPayment()
      } else {
        await processDigitalPayment()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const processCashPayment = async () => {
    const received = parseFloat(cashReceived)
    if (received < amount) {
      throw new Error('Insufficient cash amount')
    }

    const { error } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount,
        method: 'cash',
        status: 'completed',
        metadata: { cash_received: received, change: received - amount }
      })

    if (error) throw error

    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)

    onPaymentComplete()
    onClose()
  }

  const processDigitalPayment = async () => {
    if (!phoneNumber && (selectedMethod === 'mtn_momo' || selectedMethod === 'airtel_pay')) {
      throw new Error('Phone number is required')
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount,
        method: selectedMethod,
        status: 'pending',
        metadata: { phone_number: phoneNumber }
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Process with Pesapal
    const pesapal = getPesapalInstance()
    const paymentRequest = {
      id: payment.id,
      currency: 'UGX' as const,
      amount,
      description: `Order payment - ${orderId}`,
      callback_url: `${window.location.origin}/api/payments/callback`,
      billing_address: {
        email_address: 'customer@example.com',
        phone_number: phoneNumber,
        country_code: 'UG',
        first_name: 'Customer',
        last_name: 'Name'
      }
    }

    const response = await pesapal.submitOrderRequest(paymentRequest)
    
    if (response.error) {
      throw new Error(response.error.message)
    }

    // Update payment with tracking ID
    await supabase
      .from('payments')
      .update({
        pesapal_tracking_id: response.order_tracking_id,
        status: 'processing'
      })
      .eq('id', payment.id)

    // Redirect to payment page
    window.open(response.redirect_url, '_blank')
    
    onClose()
  }

  const change = selectedMethod === 'cash' && cashReceived ? 
    Math.max(0, parseFloat(cashReceived) - amount) : 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PaymentIcon />
          <Typography variant="h6">Process Payment</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={600} color="primary">
            {formatCurrency(amount)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total amount to pay
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          Select Payment Method
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {paymentMethods.map((method) => (
            <Grid item xs={6} key={method.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedMethod === method.id ? '2px solid' : '1px solid',
                  borderColor: selectedMethod === method.id ? 'primary.main' : 'divider',
                  '&:hover': { boxShadow: 2 }
                }}
                onClick={() => setSelectedMethod(method.id as PaymentMethod)}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Box sx={{ color: `${method.color}.main`, mb: 1 }}>
                    {method.icon}
                  </Box>
                  <Typography variant="body2" fontWeight={500}>
                    {method.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {selectedMethod === 'cash' && (
          <Box>
            <TextField
              fullWidth
              label="Cash Received"
              type="number"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              sx={{ mb: 2 }}
              inputProps={{ min: 0, step: 0.01 }}
            />
            {change > 0 && (
              <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="h6" color="success.dark">
                  Change: {formatCurrency(change)}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {(selectedMethod === 'mtn_momo' || selectedMethod === 'airtel_pay') && (
          <TextField
            fullWidth
            label="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="256XXXXXXXXX"
            sx={{ mb: 2 }}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          disabled={isProcessing || (selectedMethod === 'cash' && !cashReceived)}
          startIcon={isProcessing ? <CircularProgress size={20} /> : null}
        >
          {isProcessing ? 'Processing...' : 'Process Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}