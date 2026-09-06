import { NextRequest, NextResponse } from "next/server";
import { checkNestlinkBalance, getNestlinkConfig } from "@/lib/nestlink";
import { requireAdminSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  // Allow balance check either with admin session or API key
  const adminSession = requireAdminSession(req);
  const authHeader = req.headers.get("authorization") || "";
  const apiKeyHeader = req.headers.get("x-api-key") || "";
  const config = getNestlinkConfig();

  const isAuthorized =
    Boolean(adminSession) ||
    apiKeyHeader === config.clientId ||
    authHeader.replace(/^Bearer\s+/i, "") === config.clientSecret;

  // Search params may provide specific account number
  const { searchParams } = new URL(req.url);
  const requestedAccount = searchParams.get("account_number") || config.accountNumber;

  try {
    const result = await checkNestlinkBalance(requestedAccount);
    return NextResponse.json({
      ...result,
      authorized: isAuthorized,
      account_number: requestedAccount,
      mode: config.isSimulationEnabled ? "sandbox" : "live",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch balance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
