/** Small OOXML primitives: user text is always an explicit string cell. */
export const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
export function escapeXml(value: unknown): string {
  return Array.from(String(value))
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return (
        code === 9 ||
        code === 10 ||
        code === 13 ||
        (code >= 32 && code <= 0xd7ff) ||
        (code >= 0xe000 && code <= 0xfffd) ||
        (code >= 0x10000 && code <= 0x10ffff)
      );
    })
    .join('')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
export function column(index: number): string {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}
export type Cell = { value: string | number; style?: number; formula?: string; link?: string };
export const textCell = (value: string, style = 0): Cell => ({ value, style });
export const moneyCell = (kobo: number, style = 4): Cell => ({ value: kobo / 100, style });
export const dateCell = (iso: string): Cell => ({
  value: Date.parse(iso) / 86400000 + 25569,
  style: 5,
});
export function cellXml(cell: Cell, col: number, row: number): string {
  const ref = `${column(col)}${row}`;
  const style = ` s="${cell.style ?? 0}"`;
  if (typeof cell.value === 'string') {
    if (cell.value.length > 32767)
      throw new Error(`Spreadsheet text exceeds 32,767 characters at ${ref}`);
    return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.value)}</t></is></c>`;
  }
  if (!Number.isFinite(cell.value)) throw new Error(`Invalid spreadsheet number at ${ref}`);
  return `<c r="${ref}"${style} t="n">${cell.formula ? `<f>${escapeXml(cell.formula)}</f>` : ''}<v>${cell.value}</v></c>`;
}
