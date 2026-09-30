import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import toast from "react-hot-toast";
import api from "../api/axios.js";

let stripePromise;
const getStripePromise = () => {
  if (stripePromise === undefined) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : null;
  }
  return stripePromise;
};

const CheckoutForm = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message || "Payment failed");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        await api.post("/billing/payments/confirm", { paymentIntentId: paymentIntent.id });
        toast.success("Payment successful!");
        onSuccess();
      } catch {
        toast.error("Payment succeeded but reconciliation failed — please refresh and contact support if the balance looks wrong.");
      }
    } else {
      toast(`Payment status: ${paymentIntent?.status || "unknown"}`);
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-outline flex-1">
          Cancel
        </button>
        <button type="submit" disabled={!stripe || submitting} className="btn-primary flex-1">
          {submitting ? "Processing..." : "Pay Now"}
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center">
        Test card: 4242 4242 4242 4242 • any future date • any CVC
      </p>
    </form>
  );
};

// Mounts Stripe Elements around the given PaymentIntent clientSecret and
// handles on-page card collection + confirmation, then reconciles the
// invoice server-side via /billing/payments/confirm.
const StripeCheckout = ({ clientSecret, onSuccess, onCancel }) => {
  const promise = getStripePromise();

  if (!promise) {
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-4">
        Stripe is not configured on the frontend. Set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in{" "}
        <code>frontend/.env</code> (see <code>.env.example</code>) and restart the dev server to enable
        online card payments.
      </div>
    );
  }

  return (
    <Elements stripe={promise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
};

export default StripeCheckout;
