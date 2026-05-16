/** Normalize Kenyan mobile input to 254XXXXXXXXX before validation/storage. */
export function normalizePhone(phone: string) {
  let value = phone.trim().replace(/[\s\-()]/g, "");
  if (value.startsWith("+254")) value = value.slice(1);
  else if (value.startsWith("0")) value = `254${value.slice(1)}`;
  else if (/^[17]\d{8}$/.test(value)) value = `254${value}`;
  return value;
}

export const KENYA_PHONE_REGEX = /^254[17]\d{8}$/;

export const KENYA_PHONE_MESSAGE =
  "Use a Kenyan number: 07…, 01…, 712…, 2547…, 2541…, or +2547…";
