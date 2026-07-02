import { NextRequest, NextResponse } from "next/server";

const allowedMethods = "POST, OPTIONS";
const allowedHeaders = "Content-Type, Accept, x-api-key";

function allowedOrigin() {
  return process.env.MOTOR_PORTAL_ORIGIN?.trim() ?? "";
}

export function isPublicMotorOriginAllowed(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === allowedOrigin();
}

export function publicMotorCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin");
  const configuredOrigin = allowedOrigin();
  const isAllowed = origin ? origin === configuredOrigin : false;
  const headers: Record<string, string> = {
    Vary: "Origin"
  };

  if (isAllowed && configuredOrigin) {
    headers["Access-Control-Allow-Origin"] = configuredOrigin;
    headers["Access-Control-Allow-Methods"] = allowedMethods;
    headers["Access-Control-Allow-Headers"] = allowedHeaders;
    headers["Access-Control-Allow-Credentials"] = "false";
    headers["Access-Control-Max-Age"] = "86400";
  }

  return headers;
}

export function publicMotorOptions(request: NextRequest) {
  if (!isPublicMotorOriginAllowed(request)) {
    return NextResponse.json(
      { success: false, message: "CORS origin is not allowed." },
      { status: 403, headers: publicMotorCorsHeaders(request) }
    );
  }

  return new NextResponse(null, {
    status: 200,
    headers: publicMotorCorsHeaders(request)
  });
}

export function withPublicMotorCors(request: NextRequest, response: NextResponse) {
  for (const [key, value] of Object.entries(publicMotorCorsHeaders(request))) {
    response.headers.set(key, value);
  }
  return response;
}
