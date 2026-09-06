import axios from "axios";
import crypto from "crypto";

export type NestlinkStkPayload = {
  amount: number;
  phone: string;
  accountReference?: string;
  description?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

export type NestlinkStkResponse = {
  checkoutRequestId: string;
  transactionId: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  message: string;
  isSimulated?: boolean;
};

export type NestlinkStatusQueryResponse = {
  status: "PENDING" | "SUCCESS" | "FAILED" | "NOT_FOUND";
  receipt?: string;
  message?: string;
};

export type NestlinkBalanceResponse = {
  account_number: string;
  balance: number;
  currency: string;
  status: string;
  isSimulated?: boolean;
};

/**
 * Retrieves configured Nestlink / NestPay M-Pesa credentials
 */
export function getNestlinkConfig() {
  const clientId = (
    process.env.NESTLINK_CLIENT_ID ||
    process.env.NESTJS_CLIENT_ID ||
    process.env.CLIENT_ID ||
    process.env.NESTLINK_API_KEY ||
    ""
  ).trim();

  const clientSecret = (
    process.env.NESTLINK_CLIENT_SECRET ||
    process.env.NESTJS_CLIENT_SECRET ||
    process.env.CLIENT_SECRET ||
    process.env.NESTLINK_SECRET_KEY ||
    ""
  ).trim();

  const accountNumber = (
    process.env.NESTLINK_ACCOUNT_NUMBER ||
    process.env.NESTLINK_SHORTCODE ||
    "28811"
  ).trim();

  const baseUrl = (
    process.env.NESTLINK_BASE_URL ||
    "https://automate.nestlink.co.ke"
  ).replace(/\/$/, "");

  const baseOrigin = baseUrl.replace(/\/api\/?$/, "");

  const webhookSecret = (
    process.env.NESTLINK_WEBHOOK_SECRET ||
    clientSecret ||
    ""
  ).trim();

  const hasLiveCredentials = Boolean(clientId && clientSecret);
  // Never enable simulation if live credentials exist, unless explicitly requested via NESTLINK_SIMULATE_SUCCESS
  const isSimulationEnabled =
    process.env.NESTLINK_SIMULATE_SUCCESS === "true" ||
    (!hasLiveCredentials && process.env.MPESA_SIMULATE_SUCCESS === "true");

  return {
    clientId,
    clientSecret,
    accountNumber,
    baseUrl,
    baseOrigin,
    webhookSecret,
    hasLiveCredentials,
    isSimulationEnabled,
  };
}

/**
 * Generates NestLink compliant HMAC-SHA256 headers:
 * Canonical String Format:
 * ${METHOD}\n${PATH}\n${TIMESTAMP}\n${NONCE}\n${IDEMPOTENCY_KEY}\n${BODY_HASH}
 */
export function createNestlinkSignature({
  method,
  path,
  body,
  clientId,
  clientSecret,
}: {
  method: "GET" | "POST";
  path: string; // e.g., 'api/v1/stkpush/initiate' or 'api/v1/balance'
  body?: unknown;
  clientId: string;
  clientSecret: string;
}): {
  headers: Record<string, string>;
  canonicalString: string;
  rawBodyString: string;
} {
  let cleanPath = path.replace(/^\/+/, "");
  if (!cleanPath.startsWith("api/")) {
    cleanPath = `api/${cleanPath}`;
  }
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = crypto.randomUUID();
  const idempotencyKey = method === "POST" ? crypto.randomUUID() : "";

  let rawBodyString = "";
  let bodyHash = "";

  if (method === "POST" && body !== undefined && body !== null) {
    rawBodyString = typeof body === "string" ? body : JSON.stringify(body);
    bodyHash = crypto.createHash("sha256").update(rawBodyString).digest("hex");
  } else {
    // Empty body requires sha256 hash of empty string
    bodyHash = crypto.createHash("sha256").update("").digest("hex");
  }

  // Exact Canonical String Format:
  // ${METHOD}\n${PATH}\n${TIMESTAMP}\n${NONCE}\n${IDEMPOTENCY_KEY}\n${BODY_HASH}
  const canonicalString = `${method}\n${cleanPath}\n${timestamp}\n${nonce}\n${idempotencyKey}\n${bodyHash}`;

  const signature = crypto
    .createHmac("sha256", clientSecret)
    .update(canonicalString)
    .digest("hex");

  const headers: Record<string, string> = {
    "X-API-Key": clientId,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Signature": signature,
    Accept: "application/json",
  };

  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  if (method === "POST") {
    headers["Content-Type"] = "application/json";
  }

  return { headers, canonicalString, rawBodyString };
}

/**
 * Normalize Kenyan mobile input to standard Safaricom/Airtel format 254XXXXXXXXX
 */
export function normalizeNestlinkPhone(phone: string): string {
  const raw = phone.trim().replace(/[\s\-()]/g, "");
  if (raw.startsWith("+254")) return raw.slice(1);
  if (raw.startsWith("254")) return raw;
  if (raw.startsWith("0")) return `254${raw.slice(1)}`;
  if (/^[17]\d{8}$/.test(raw)) return `254${raw}`;
  return raw;
}

/**
 * Initiates an M-Pesa STK Push payment via NestLink API with cryptographic HMAC-SHA256 authentication
 */
export async function initiateNestlinkStkPush(payload: NestlinkStkPayload): Promise<NestlinkStkResponse> {
  const config = getNestlinkConfig();
  const formattedPhone = normalizeNestlinkPhone(payload.phone);
  const roundedAmount = Math.ceil(payload.amount);
  const reference = (payload.accountReference ?? `KCSE-${Date.now().toString().slice(-6)}`).toUpperCase();
  const description = payload.description ?? "Payment for KCSE Access";

  // Build the standardized STK push request body according to NestLink specifications
  const requestBody = {
    account_number: config.accountNumber,
    phone: formattedPhone,
    amount: roundedAmount,
    reference,
    description,
    callback_url: payload.callbackUrl || "https://your-domain.com/api/payments/callback",
  };

  // If live credentials are provided and sandbox simulation is disabled, execute live request
  if (config.hasLiveCredentials && !config.isSimulationEnabled) {
    const path = "api/v1/stkpush/initiate";
    const endpointUrl = `${config.baseOrigin}/${path}`;

    const { headers, rawBodyString } = createNestlinkSignature({
      method: "POST",
      path,
      body: requestBody,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });

    try {
      const response = await axios.post(endpointUrl, rawBodyString, {
        headers,
        timeout: 25000,
      });

      const resData = response.data?.data ?? response.data;
      const checkoutRequestId = String(
        resData.checkout_id ||
        resData.checkoutRequestId ||
        resData.CheckoutRequestID ||
        resData.id ||
        resData.reference ||
        `NL_${Date.now()}`
      );
      const transactionId = String(
        resData.transactionId ||
        resData.MerchantRequestID ||
        resData.correlation_id ||
        reference
      );
      const customerMessage =
        resData.message ||
        response.data?.message ||
        resData.CustomerMessage ||
        "STK push prompt sent. Please check your phone to enter your M-Pesa PIN.";

      return {
        checkoutRequestId,
        transactionId,
        status: "PENDING",
        message: customerMessage,
        isSimulated: false,
      };
    } catch (err: unknown) {
      let rawError = "";
      if (axios.isAxiosError(err)) {
        const respData = err.response?.data;
        if (typeof respData === "string") {
          rawError = respData;
        } else if (respData && typeof respData === "object") {
          rawError =
            respData.message ||
            respData.error?.message ||
            respData.error ||
            respData.errorMessage ||
            JSON.stringify(respData);
        }
      }
      const errorMsg = rawError || (err instanceof Error ? err.message : "Failed to reach NestLink gateway.");

      // Never give a fake success or fall back to simulation when live credentials are in use
      throw new Error(`[NestLink Gateway] ${errorMsg}`);
    }
  }

  // Realistic Sandbox / Instant Mock Simulation Mode (only when credentials are not configured)
  const randomRef = `NSTL${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const checkoutId = `NL_CHK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  return {
    checkoutRequestId: checkoutId,
    transactionId: randomRef,
    status: "PENDING",
    message: `NestLink STK prompt dispatched to 0${formattedPhone.slice(3)}. Check your phone to enter M-Pesa PIN.`,
    isSimulated: true,
  };
}

/**
 * Check NestLink merchant balance with HMAC-SHA256 signature
 */
export async function checkNestlinkBalance(accountNumber?: string): Promise<NestlinkBalanceResponse> {
  const config = getNestlinkConfig();
  const accNum = accountNumber || config.accountNumber;

  if (config.hasLiveCredentials && !config.isSimulationEnabled) {
    const path = "api/v1/balance";
    const endpointUrl = `${config.baseOrigin}/${path}`;

    const { headers } = createNestlinkSignature({
      method: "GET",
      path,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });

    try {
      const response = await axios.get(endpointUrl, {
        headers,
        timeout: 15000,
      });
      const data = response.data?.data ?? response.data;
      const bal = data.available_balance !== undefined ? data.available_balance : (Number(data.available_balance_minor ?? 0) / 100);
      return {
        account_number: accNum,
        balance: Number(bal),
        currency: data.currency || "KES",
        status: "success",
        isSimulated: false,
      };
    } catch (err) {
      console.warn("[Nestlink] Balance check live request error:", err instanceof Error ? err.message : err);
    }
  }

  // Sandbox simulation response
  return {
    account_number: accNum,
    balance: 24850,
    currency: "KES",
    status: "success",
    isSimulated: true,
  };
}

/**
 * Query payment status directly from the Nestlink gateway
 */
export async function queryNestlinkPaymentStatus(
  checkoutRequestId: string,
  transactionId?: string
): Promise<NestlinkStatusQueryResponse> {
  const config = getNestlinkConfig();
  if (!config.hasLiveCredentials || config.isSimulationEnabled) {
    return { status: "PENDING" };
  }

  try {
    const path = `v1/stkpush/query`;
    const { headers, rawBodyString } = createNestlinkSignature({
      method: "POST",
      path,
      body: {
        account_number: config.accountNumber,
        checkout_request_id: checkoutRequestId,
        checkoutRequestId,
        transactionId,
      },
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });

    const response = await axios.post(`${config.baseUrl}/${path}`, rawBodyString, {
      headers,
      timeout: 12000,
    });

    const data = response.data?.data ?? response.data;
    const rawStatus = String(data.status || data.ResultCode || data.state || "").toUpperCase();

    if (rawStatus === "SUCCESS" || rawStatus === "COMPLETED" || rawStatus === "PAID" || rawStatus === "0") {
      const receipt = data.mpesaReceiptNumber || data.receiptNumber || data.receipt || data.transactionId;
      return {
        status: "SUCCESS",
        receipt: receipt ? String(receipt) : undefined,
        message: data.message || "Payment verified successfully",
      };
    }

    if (rawStatus === "FAILED" || rawStatus === "CANCELLED" || rawStatus === "EXPIRED" || (data.ResultCode && data.ResultCode !== 0)) {
      return {
        status: "FAILED",
        message: data.ResultDesc || data.message || "Payment failed or was cancelled",
      };
    }

    return { status: "PENDING" };
  } catch (err) {
    console.warn("[Nestlink] Query status lookup error:", err instanceof Error ? err.message : err);
    return { status: "PENDING" };
  }
}

/**
 * Verify Nestlink Webhook HMAC-SHA256 signature
 */
export function verifyNestlinkWebhook(rawBody: string, signature: string): boolean {
  const config = getNestlinkConfig();
  const secret = config.webhookSecret || config.clientSecret;
  if (!secret) return true; // If webhook secret is not configured, allow processing
  if (!signature) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    return (
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    );
  } catch {
    return false;
  }
}


