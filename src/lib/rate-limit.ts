const requestMap = new Map<string, { count: number; start: number }>();

export function rateLimit(key: string, max = 10, windowMs = 60_000) {
  const now = Date.now();
  const prev = requestMap.get(key);
  if (!prev || now - prev.start > windowMs) {
    requestMap.set(key, { count: 1, start: now });
    return true;
  }
  if (prev.count >= max) return false;
  prev.count += 1;
  requestMap.set(key, prev);
  return true;
}
