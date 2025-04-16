import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Return static mock data for the dashboard
    return NextResponse.json({
      totalUsers: 156,
      totalVideos: 423,
      activeSubscriptions: 78,
      overview: {
        totalUsers: 156,
        totalVideos: 423,
        activeSubscriptions: 78,
        newUsers: 23,
        recentVideos: 47,
        totalStorage: 1073741824, // 1GB in bytes
        avgProcessingTime: 120 // 2 minutes in seconds
      },
      subscriptionsByPlan: [
        { plan: "basic", _count: { plan: 45 } },
        { plan: "premium", _count: { plan: 28 } },
        { plan: "enterprise", _count: { plan: 5 } }
      ],
      userSignupData: [
        { date: "2023-04-01", count: 3 },
        { date: "2023-04-02", count: 2 },
        { date: "2023-04-03", count: 5 },
        { date: "2023-04-04", count: 1 },
        { date: "2023-04-05", count: 4 },
        { date: "2023-04-06", count: 2 },
        { date: "2023-04-07", count: 6 }
      ]
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 