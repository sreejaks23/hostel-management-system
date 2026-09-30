import Stripe from "stripe";

let stripeClient;

// const getStripe = () => {
//   if (!stripeClient) {
//     if (!process.env.STRIPE_SECRET_KEY) {
//       throw new Error("Stripe secret key not configured. Set STRIPE_SECRET_KEY in .env");
//     }
//     stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
//   }
//   return stripeClient;
// };

const getStripe = () => {
  console.log(
    "Stripe key:",
    process.env.STRIPE_SECRET_KEY
      ? `${process.env.STRIPE_SECRET_KEY.substring(0, 8)}...`
      : "MISSING"
  );

  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "Stripe secret key not configured. Set STRIPE_SECRET_KEY in .env"
      );
    }

    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};

// Creates a PaymentIntent for a given invoice amount (in smallest currency unit, e.g. cents)
export const createPaymentIntent = async ({ amount, currency = "usd", metadata = {} }) => {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
};

export const constructWebhookEvent = (rawBody, signature) => {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

export const retrievePaymentIntent = async (id) => {
  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(id);
};
