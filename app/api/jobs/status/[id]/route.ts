import { NextRequest, NextResponse } from "next/server";

// Get API endpoint from environment variable
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://api.editur.ai/api/v1';

/**
 * Proxy API route to fetch job status from external API
 * This resolves CORS issues by having the server make the request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if params exists before trying to access id
  if (!params) {
    return NextResponse.json(
      { error: "Missing request parameters" },
      { status: 400 }
    );
  }
  
  // Get the id parameter and validate it
  const { id } = params;
  
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: "Job ID is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${API_ENDPOINT}/jobs/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.API_KEY || 'test-key-123'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to fetch job status", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching job status:", error);
    return NextResponse.json(
      { error: "Failed to fetch job status" },
      { status: 500 }
    );
  }
} 