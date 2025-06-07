"use server";
import {prisma} from "@/lib/prisma";

export const createSubscription = async ({ userId }: { userId: string }) => {
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const subscription = await prisma.subscription.upsert({
            where: { userId },
            update: { updatedAt: new Date(), subscribed: true },
            create: { userId, subscribed: true, createdAt: new Date(), updatedAt: new Date() }
        });

        return { success: true, message: "Subscription created/updated successfully", data: subscription };
    } catch (error) {
        console.error("Error creating subscription:", error);
        return { success: false, message: "Failed to create subscription" };
    }
};

export const getUserSubscription = async (userId: string) => {
    try {
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const subscription = await prisma.subscription.findFirst({
            where: { userId }
        });

        return { success: true, isSubscribed: subscription?.subscribed || false };
    } catch (error) {
        console.error("Error fetching subscription:", error);
        return { success: false, message: "Failed to fetch subscription" };
    }
};
