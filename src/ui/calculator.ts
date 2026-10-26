/** Evaluate simple arithmetic without executing user input. Standard precedence. */
export function calculate(expression: string): number | null {
  const source = expression
    .replace(/\s/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');
  const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/]/g);
  if (!tokens || tokens.join('') !== source || tokens.length > 100) return null;
  const values: number[] = [];
  const ops: string[] = [];
  let expectNumber = true;
  let sign = 1;
  for (const token of tokens) {
    if (expectNumber) {
      if (token === '-' && sign === 1) {
        sign = -1;
        continue;
      }
      if (!/^\d|^\./.test(token)) return null;
      values.push(Number(token) * sign);
      sign = 1;
      expectNumber = false;
    } else {
      if (!/^[+\-*/]$/.test(token)) return null;
      ops.push(token);
      expectNumber = true;
    }
  }
  if (expectNumber) return null;
  for (let i = 0; i < ops.length;) {
    if (ops[i] === '*' || ops[i] === '/') {
      if (ops[i] === '/' && values[i + 1] === 0) return null;
      values.splice(
        i,
        2,
        ops[i] === '*' ? values[i]! * values[i + 1]! : values[i]! / values[i + 1]!,
      );
      ops.splice(i, 1);
    } else i++;
  }
  let result = values[0]!;
  for (let i = 0; i < ops.length; i++)
    result = ops[i] === '+' ? result + values[i + 1]! : result - values[i + 1]!;
  return Number.isFinite(result) && Math.abs(result) < Number.MAX_SAFE_INTEGER / 100
    ? Math.round((result + Number.EPSILON) * 100) / 100
    : null;
}
