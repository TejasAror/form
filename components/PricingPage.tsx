"use client"
import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";

import { Badge } from "./ui/badge";
import {useRouter}  from "next/navigation";
import { getStripe } from "@/lib/stripe-client";
import { PricingPlan, pricingPlan } from "@/lib/PricingPlan";


type Props = {
  userId: string | undefined;
};

const PricingPage: React.FC<Props> = ({ userId }) => {
  const router = useRouter();

  const checkoutHandler = async (price: number, plan: string) => {
    if (!userId) {
      router.push("/sign-in");
      return;
    }
  
    if (price === 0) return;
  
    try {
      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price, userId, plan }),
      });
  
      const data = await response.json();
      console.log("Stripe API Response:", data); // ✅ Debugging log
  
      if (!response.ok || !data.sessionId) {
        console.error("Stripe session creation failed:", data);
        alert(data.error || "Something went wrong. Please try again.");
        return;
      }
  
      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId: data.sessionId });
    } catch (error) {
      console.error("Stripe Error:", error);
      alert("Payment could not be processed. Please try again.");
    }
  };
  

  return (
    <div>
      <div className="text-center mb-16">
        <h1 className="font-extrabold text-3xl">Plan and Pricing</h1>
        <p className="text-gray-500">
          Receive unlimited credits when you pay earl, and save your plan.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {pricingPlan.map((plan: PricingPlan, index: number) => (
          <Card
            className={`${
              plan.level === "Enterprise" && "bg-[#1c1c1c] text-white"
            } w-[350px] flex flex-col justify-between`}
            key={index}
          >
            <CardHeader className="flex flex-row items-center gap-2">
              <CardTitle>{plan.level}</CardTitle>
              {plan.level === "Pro" && (
                <Badge className="rounded-full bg-orange-600 hover:bg-null">
                  🔥 Popular
                </Badge>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-2xl font-bold">{plan.price}</p>
              <ul className="mt-4 space-y-2">
                {plan.services.map((item: string, index: number) => (
                  <li className="flex items-center" key={index}>
                    <span className="text-green-500 mr-2">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant={`${
                  plan.level === "Enterprise" ? "default" : "outline"
                }`}
                className={`${
                  plan.level === "Enterprise" &&
                  "text-black bg-white hover:bg-null"
                } w-full`}
                onClick={() =>
                  checkoutHandler(
                    plan.level === "Pro"
                      ? 29
                      : plan.level === "Enterprise"
                      ? 70
                      : 0,
                    plan.level
                  )
                }
              >
                Get started with {plan.level}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;