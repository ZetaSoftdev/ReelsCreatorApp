import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";
import * as z from "zod";

const updateSubscriptionSchema = z.object({
  plan: z.enum(["free", "basic", "pro", "enterprise"]),
  status: z.enum(["active", "canceled", "expired"]),
  minutesAllowed: z.number().min(0),
  minutesUsed: z.number().min(0),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== Role.ADMIN) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!subscription) {
      return new NextResponse("Subscription not found", { status: 404 });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        plan: validatedData.plan,
        status: validatedData.status,
        minutesAllowed: validatedData.minutesAllowed,
        minutesUsed: validatedData.minutesUsed,
      },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error("[SUBSCRIPTION_UPDATE]", error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    
    return new NextResponse("Internal server error", { status: 500 });
  }
} 