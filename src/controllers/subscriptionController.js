const crypto = require("crypto");
const Razorpay = require("razorpay");
const prisma = require("../utils/prismaClient");
const { ok, badRequest, serverError } = require("../utils/apiResponse");

// Plan prices in paise (INR × 100)
const PLAN_PRICES = {
  BASIC:   { monthly: 9900,  annual: 94800  },
  PRO:     { monthly: 19900, annual: 178800 },
  PREMIUM: { monthly: 49900, annual: 478800 },
};

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ── POST /subscriptions/order ─────────────────────────────────────────────────

const createOrder = async (req, res, next) => {
  try {
    const { plan, billing } = req.body;

    const planUpper = (plan || "").toUpperCase();
    const billingKey = billing === "annual" ? "annual" : "monthly";

    if (!PLAN_PRICES[planUpper]) {
      return badRequest(res, `Invalid plan. Choose from: ${Object.keys(PLAN_PRICES).join(", ")}`);
    }

    const amount = PLAN_PRICES[planUpper][billingKey];
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `sub_${req.user.id}_${Date.now()}`,
    });

    return ok(res, "Order created", {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /subscriptions/verify ────────────────────────────────────────────────

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billing } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return badRequest(res, "Missing Razorpay payment fields");
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return badRequest(res, "Payment verification failed: invalid signature");
    }

    const planUpper = (plan || "").toUpperCase();
    const billingKey = billing === "annual" ? "annual" : "monthly";

    if (!PLAN_PRICES[planUpper]) {
      return badRequest(res, "Invalid plan");
    }

    const now = new Date();
    const expiresAt = new Date(now);
    if (billingKey === "annual") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: req.user.id },
      update: {
        plan: planUpper,
        status: "ACTIVE",
        startsAt: now,
        expiresAt,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
      create: {
        userId: req.user.id,
        plan: planUpper,
        status: "ACTIVE",
        startsAt: now,
        expiresAt,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    return ok(res, "Payment verified. Subscription activated.", {
      plan: subscription.plan,
      status: subscription.status,
      startsAt: subscription.startsAt,
      expiresAt: subscription.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, verifyPayment };
