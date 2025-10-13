# 💳 Pesapal Payment Integration - Implementation Guide

## ✅ PHASE 1: COMPLETE - Backend Infrastructure

### **Payment Methods Supported:**
1. 💵 **Cash** - Manual confirmation by waiter
2. 📱 **Airtel Money** - STK Push (customer enters PIN on phone)
3. 📱 **MTN Mobile Money** - STK Push (customer enters PIN on phone)
4. 💳 **Visa/Mastercard** - External POS terminal with webhook confirmation

---

## 🚀 What's Been Built:

### **1. Database Schema** ✅
- **payments table** - Tracks all transactions
  - Supports all 4 payment methods
  - Stores phone numbers for mobile money
  - Links to orders and users
  - Real-time sync enabled
- **orders.payment_status** - Track order payment state
  - unpaid, pending, paid, partially_paid, refunded

### **2. Pesapal API Integration** ✅
**File:** `/src/lib/pesapal.ts`
- Authentication & token management
- Mobile money STK Push initiation
- Payment status checking
- Phone number validation (Uganda format)
- Provider validation (Airtel vs MTN)

### **3. API Endpoints** ✅

#### **POST `/api/payments/initiate`**
Initiates payments for all methods:
```typescript
// Cash
{ orderId, amount, paymentMethod: 'cash', processedBy, locationId }

// Mobile Money
{ orderId, amount, paymentMethod: 'airtel_money|mtn_momo', 
  phoneNumber: '0775123456', processedBy, locationId }

// Card POS
{ orderId, amount, paymentMethod: 'card_pos', processedBy, locationId }
```

#### **GET `/api/payments/status?paymentId=xxx`**
Check payment status in real-time

#### **GET `/api/pesapal/webhook`**
Receives instant payment confirmations from Pesapal

---

## 🔐 Environment Variables Needed:

Add these to **Vercel** environment variables:

```bash
# Pesapal Live/Production
PESAPAL_CONSUMER_KEY=<your_consumer_key_from_pesapal>
PESAPAL_CONSUMER_SECRET=<your_consumer_secret_from_pesapal>
PESAPAL_API_URL=https://pay.pesapal.com/v3
PESAPAL_IPN_ID=<get this from Pesapal dashboard>
NEXT_PUBLIC_BASE_URL=https://yaya-pos-system.vercel.app
```

**⚠️ SECURITY NOTE:**
- NEVER commit actual credentials to GitHub
- Add them ONLY to Vercel environment variables
- Keep your Pesapal credentials safe and private

---

## 📋 TODO: Complete Setup

### **Step 1: Register IPN URL with Pesapal**
1. Login to Pesapal dashboard: https://www.pesapal.com
2. Navigate to: **Settings → IPN Configuration**
3. Register this URL as your IPN endpoint:
   ```
   https://yaya-pos-system.vercel.app/api/pesapal/webhook
   ```
4. Set notification type: **GET**
5. Copy the `IPN ID` and add to Vercel environment variables

### **Step 2: Add Environment Variables to Vercel**
1. Go to: https://vercel.com/syncsphere7/yaya-pos-system
2. Navigate to: **Settings → Environment Variables**
3. Add all variables listed above
4. Redeploy the application

### **Step 3: Update POS UI** (Next Phase)
- Add payment method selector
- Create mobile money phone input
- Add payment status tracking
- Implement real-time notifications

---

## 🔄 Payment Flow:

### **Cash Payment:**
```
Waiter → Clicks "Cash" → Confirms amount 
      → Order marked "Paid - Cash" ✅
      → Receipt generated
```

### **Airtel Money / MTN MoMo:**
```
Waiter → Clicks "Airtel/MTN" → Enters customer phone
      → API sends STK Push to customer's phone
      → Customer sees: "Enter PIN to pay UGX 50,000"
      → Customer enters PIN
      → Pesapal sends webhook → Order marked "Paid" ✅
      → Real-time notification on dashboard 🔔
      → Receipt generated
```

### **Card (POS Terminal):**
```
Customer → Swipes card on Pesapal terminal
         → Enters PIN on terminal
         → Pesapal sends webhook → Order marked "Paid" ✅
         → Real-time notification on dashboard 🔔
         → Receipt generated
```

---

## 🧪 Testing Flow:

### **1. Test Cash Payment:**
```bash
POST /api/payments/initiate
{
  "orderId": "uuid-of-order",
  "amount": 50000,
  "paymentMethod": "cash",
  "processedBy": "waiter-user-id",
  "locationId": "location-id"
}
```

### **2. Test Mobile Money:**
```bash
POST /api/payments/initiate
{
  "orderId": "uuid-of-order",
  "amount": 50000,
  "paymentMethod": "airtel_money",
  "phoneNumber": "0750123456",  # Airtel number
  "processedBy": "waiter-user-id",
  "locationId": "location-id"
}
```

### **3. Check Payment Status:**
```bash
GET /api/payments/status?paymentId=payment-uuid
```

---

## 🎯 Phone Number Format:

### **Accepted Formats:**
- `0775123456` (With leading 0)
- `775123456` (Without leading 0)
- `+256775123456` (With country code)
- `256775123456` (Without +)

### **Provider Validation:**
- **Airtel:** 070x, 075x
- **MTN:** 077x, 078x, 076x

System automatically:
- ✅ Formats to `+256` format
- ✅ Validates provider matches payment method
- ✅ Returns error if mismatch

---

## 🔔 Real-time Notifications:

Webhooks automatically trigger:
1. ✅ Database updates (payment status)
2. ✅ Order status changes
3. ✅ Supabase real-time broadcasts
4. ✅ Dashboard notifications (to be added in UI)

---

## 🎨 Next Phase: UI Integration

### **What Needs to be Built:**

1. **Payment Modal in POS**
   - Show 4 payment buttons
   - Phone input for mobile money
   - Loading state while waiting
   - Success/failure notifications

2. **Real-time Status Updates**
   - Toast notifications when payment received
   - Sound alert (optional)
   - Order status badge updates

3. **Payment History**
   - View all transactions
   - Filter by method, status
   - Export reports

4. **Receipt Generation**
   - PDF receipts
   - Print functionality
   - Email delivery

---

## 📊 Database Tables:

### **payments**
```sql
id, order_id, payment_method, amount, currency,
status, phone_number, transaction_id, confirmation_code,
payment_date, processed_by, location_id, created_at, updated_at
```

### **orders.payment_status**
- unpaid (default)
- pending (waiting for confirmation)
- paid (confirmed)
- partially_paid
- refunded

---

## 🔒 Security:

- ✅ Credentials stored in environment variables
- ✅ Never exposed in frontend code
- ✅ API routes protected
- ✅ Webhook signature verification (to be added)
- ✅ RLS policies on payments table

---

## 🚨 Important Notes:

1. **Live Environment** - Using real Pesapal production credentials
2. **Real Money** - All transactions are real
3. **IPN Registration** - Must register webhook URL in Pesapal dashboard
4. **Phone Validation** - System validates provider before sending STK Push
5. **Webhook Critical** - Real-time updates depend on webhook working

---

## 📞 Support:

**Pesapal Support:**
- Website: https://www.pesapal.com
- Email: support@pesapal.com
- Phone: +254 709 974 000

**Integration Docs:**
https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference

---

## ✅ Status:

- [x] Database schema
- [x] Pesapal API integration
- [x] Payment initiation endpoint
- [x] Webhook endpoint
- [x] Status check endpoint
- [x] Phone validation
- [ ] Register IPN URL (manual step)
- [ ] Add environment variables to Vercel
- [ ] Update POS UI
- [ ] Add real-time notifications
- [ ] Receipt generation
- [ ] Testing with live payments

---

**Ready for Phase 2: UI Integration!** 🚀

Once you:
1. Register IPN URL in Pesapal dashboard
2. Add environment variables to Vercel
3. Confirm - I'll build the payment UI in POS dashboard
