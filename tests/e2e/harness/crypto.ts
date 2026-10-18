import { createHmac, timingSafeEqual } from 'node:crypto';
import { DEFAULT_PAYLOAD_SECRET } from './contracts.ts';

export function signManagementLink(
  appointmentId: string,
  expires: number,
  secret: string = process.env.PAYLOAD_SECRET || DEFAULT_PAYLOAD_SECRET
): string {
  const payload = `${appointmentId}:${expires}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyManagementLinkSignature(
  appointmentId: string,
  expires: number,
  signature: string,
  secret: string = process.env.PAYLOAD_SECRET || DEFAULT_PAYLOAD_SECRET
): boolean {
  if (Date.now() > expires) {
    return false;
  }
  const expectedSignature = signManagementLink(appointmentId, expires, secret);
  try {
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expectedSignature, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function buildSignedUrls(
  appointmentId: string,
  ttlSeconds: number = 7 * 24 * 3600, // 7 days
  locale: 'bn' | 'en' = 'bn',
  baseUrl: string = 'http://localhost:3000',
  secret: string = process.env.PAYLOAD_SECRET || DEFAULT_PAYLOAD_SECRET
) {
  const expires = Date.now() + ttlSeconds * 1000;
  const signature = signManagementLink(appointmentId, expires, secret);
  const base = `${baseUrl}/${locale}/appointment/manage`;
  return {
    expires,
    signature,
    managementUrl: `${base}?id=${encodeURIComponent(appointmentId)}&sig=${signature}&expires=${expires}`,
    cancellationUrl: `${base}?id=${encodeURIComponent(appointmentId)}&sig=${signature}&expires=${expires}&action=cancel`,
  };
}
