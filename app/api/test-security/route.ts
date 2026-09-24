import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const command = url.searchParams.get("command");

  const apiKey = "sk-test-secret-example";

  console.log("User command:", command);

  if (command) {
    eval(command);
  }

  return NextResponse.json({
    success: true,
    apiKey,
  });
}