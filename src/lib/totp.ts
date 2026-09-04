import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

export type TotpSetupResult = {
  secret: string;
  uri: string;
  qrDataUrl: string;
};

/**
 * Generates a new TOTP secret and Google Authenticator setup URI & QR code.
 */
export async function generateTotpSetup(username: string, issuer = "KCSE 2026 Portal"): Promise<TotpSetupResult> {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer,
    label: username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  const uri = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(uri, {
    margin: 2,
    width: 250,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return {
    secret: secret.base32,
    uri,
    qrDataUrl,
  };
}

/**
 * Validates a 6-digit TOTP token against a base32 secret.
 * Allows a tolerance window of 1 (±30s) to account for slight clock drifts.
 */
export function verifyTotpToken({
  secret,
  token,
}: {
  secret: string;
  token: string;
}): boolean {
  if (!secret || !token) return false;
  const cleanToken = token.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleanToken)) return false;

  try {
    const totp = new OTPAuth.TOTP({
      issuer: "KCSE 2026 Portal",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret.trim().replace(/\s+/g, "").toUpperCase()),
    });

    const delta = totp.validate({
      token: cleanToken,
      window: 1,
    });

    return delta !== null;
  } catch (err) {
    console.error("[TOTP] verify error:", err);
    return false;
  }
}
