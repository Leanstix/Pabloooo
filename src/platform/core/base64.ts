const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/** Small decoder for bounded native file headers, without Node's Buffer. */
export function decodeBase64(value: string): Uint8Array {
  const clean = value.replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 !== 0) throw new Error('Invalid base64 file header.');
  const result: number[] = [];
  for (let index = 0; index < clean.length; index += 4) {
    const a = alphabet.indexOf(clean.charAt(index)); const b = alphabet.indexOf(clean.charAt(index + 1));
    const c = alphabet.indexOf(clean.charAt(index + 2)); const d = alphabet.indexOf(clean.charAt(index + 3));
    result.push((a << 2) | (b >> 4));
    if (c >= 0) result.push(((b & 15) << 4) | (c >> 2));
    if (d >= 0) result.push(((c & 3) << 6) | d);
  }
  return Uint8Array.from(result);
}
