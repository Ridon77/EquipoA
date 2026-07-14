export function isWebCryptoAvailable(): boolean {
  return (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.subtle?.digest === 'function'
  );
}

export async function hashPassword(value: string): Promise<string> {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto API no disponible');
  }

  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
