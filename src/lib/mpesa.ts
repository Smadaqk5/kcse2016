import axios from "axios";

type StkPayload = {
  amount: number;
  phone: string;
};

function normalizeKenyanPhone(phone: string) {
  const raw = phone.trim().replace(/\s+/g, "");
  if (raw.startsWith("+254")) return raw;
  if (raw.startsWith("254")) return `+${raw}`;
  if (raw.startsWith("0")) return `+254${raw.slice(1)}`;
  return raw;
}

export async function initiateStkPush(payload: StkPayload) {
  const key = process.env.LIPANA_SECRET_KEY;
  if (!key) throw new Error("LIPANA_SECRET_KEY is missing.");
  const base = process.env.LIPANA_BASE_URL || "https://api.lipana.dev/v1";
  const response = await axios.post(
    `${base}/transactions/push-stk`,
    {
      Amount: Math.ceil(payload.amount),
      amount: Math.ceil(payload.amount),
      phone: normalizeKenyanPhone(payload.phone),
    },
    {
      headers: {
        "x-api-key": key,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    },
  );

  const data = response.data?.data ?? response.data;
  return {
    checkoutRequestId: data.checkoutRequestID as string | undefined,
    transactionId: data.transactionId as string | undefined,
    message: response.data?.message ?? "STK push initiated",
  };
}
