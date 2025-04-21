import { NextRequest, NextResponse } from 'next/server';

// This proxy allows us to safely make requests to the HTTP API from our HTTPS site
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return await proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return await proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return await proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return await proxyRequest(request, params.path, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    console.log(`Proxying ${method} request to: ${pathSegments.join('/')}`);
    
    // Get the raw API base URL without the /api/v1 part
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT?.replace('/api/v1', '') || '';
    
    // Reconstruct the URL with /api/v1 and the path segments
    const targetUrl = `${apiBaseUrl}/api/v1/${pathSegments.join('/')}`;
    
    // Copy original request headers
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // Skip host header to avoid conflicts
      if (key.toLowerCase() !== 'host') {
        headers.append(key, value);
      }
    });
    
    // Get the request body if it exists
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.blob();
      } catch (error) {
        console.error('Error reading request body:', error);
      }
    }
    
    // Clone URL parameters 
    const url = new URL(targetUrl);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    console.log(`Proxying to: ${url.toString()}`);
    
    // Make the request to the API server
    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
      // Don't follow redirects, let the client handle them
      redirect: 'manual',
    });
    
    // Copy the response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Skip certain headers that might cause issues
      if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
        responseHeaders.append(key, value);
      }
    });
    
    // Add CORS headers if needed
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    // Get response body as blob
    const responseBody = await response.blob();
    
    // Return the proxied response
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Required for Edge API routes
export const config = {
  runtime: 'nodejs',
}; 