import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { price, userId, plan } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Ensure price is a number
    if (!price || isNaN(price)) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    // Ensure Base URL is correctly set
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: "Frontend URL is missing" }, { status: 400 });
    }

    const successUrl = `${baseUrl}/success`;
    const cancelUrl = `${baseUrl}/cancel`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "upi", "netbanking"], // ✅ Add UPI & Netbanking for India
        line_items: [
          {
            price_data: {
              currency: "inr", // ✅ Use INR instead of USD
              unit_amount: Math.round(price * 100),
              product_data: { name: `You are choosing ${plan} plan` },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}/cancel`,
        metadata: { userId },
      });
      

    return NextResponse.json({ sessionId: session.id, url: session.url }, { status: 200 });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
