const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export function checkRateLimit(ip: string, limit = 10, windowMs = 60000): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    const newRecord = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(ip, newRecord);
    return { allowed: true, remaining: limit - 1, reset: newRecord.resetTime };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count, reset: record.resetTime };
}
