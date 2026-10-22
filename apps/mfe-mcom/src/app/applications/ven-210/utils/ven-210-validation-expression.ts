/** Evaluate declarative legacy comparisons without executing server-provided JavaScript. */
export function compileValidation(expression: string): (event: unknown) => boolean {
  if (expression.length > 4096) throw new Error('La validación configurada es demasiado extensa.');
  const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|===|!==|>=|<=|==|!=|&&|\|\||\?\?|[A-Za-z_$][\w$]*|[()[\].,+*/%?:!<>-]/g) ?? [];
  if (tokens.join('') !== expression.replace(/\s+(?=(?:[^"']|"[^"]*"|'[^']*')*$)/g, '')) {
    // Check coverage using the same lexical grammar; whitespace inside strings is meaningful.
    const residue = expression.replace(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|===|!==|>=|<=|==|!=|&&|\|\||\?\?|[A-Za-z_$][\w$]*|[()[\].,+*/%?:!<>-]|\s+/g, '');
    if (residue) throw new Error('La validación contiene una expresión no admitida.');
  }
  type Value = (event: unknown) => unknown;
  let index = 0;
  let depth = 0;
  const precedence: Record<string, number> = {'??':1,'||':1,'&&':2,'==':3,'!=':3,'===':3,'!==':3,'>':4,'<':4,'>=':4,'<=':4,'+':5,'-':5,'*':6,'/':6,'%':6};
  const peek = () => tokens[index];
  const expect = (token: string) => { if (tokens[index++] !== token) throw new Error('Expresión de validación inválida.'); };
  const functions: Record<string, (...args: unknown[]) => unknown> = {
    Number: value => Number(value), String: value => String(value), Boolean: value => Boolean(value),
    parseFloat: value => Number.parseFloat(String(value)), parseInt: (value, radix) => Number.parseInt(String(value), Number(radix ?? 10)),
    isNaN: value => Number.isNaN(Number(value)), isFinite: value => Number.isFinite(Number(value)),
    'Math.abs': value => Math.abs(Number(value)), 'Math.round': value => Math.round(Number(value)),
    'Math.floor': value => Math.floor(Number(value)), 'Math.ceil': value => Math.ceil(Number(value)),
    'Math.min': (...values) => Math.min(...values.map(Number)), 'Math.max': (...values) => Math.max(...values.map(Number)),
    'Number.isFinite': value => Number.isFinite(value), 'Number.isNaN': value => Number.isNaN(value)
  };
  function member(object: unknown, key: unknown): unknown {
    const name = String(key);
    if (['constructor','prototype','__proto__'].includes(name)) throw new Error('Propiedad no admitida en validación.');
    if (typeof object === 'string' && name === 'length') return object.length;
    if (object && typeof object === 'object' && Object.prototype.hasOwnProperty.call(object, name)) return (object as Record<string, unknown>)[name];
    return undefined;
  }
  function primary(): Value {
    if (++depth > 64) throw new Error('Validación demasiado anidada.');
    const token = tokens[index++];
    let value: Value;
    if (token === '(') { value = parse(0); expect(')'); }
    else if (['!', '+', '-'].includes(token)) {
      const right = primary(); value = event => token === '!' ? !right(event) : token === '-' ? -Number(right(event)) : Number(right(event));
    } else if (/^(?:\d|\.\d)/.test(token ?? '')) { value = () => Number(token); }
    else if (token?.startsWith('"') || token?.startsWith("'")) {
      const text = token.slice(1,-1).replace(/\\(['"\\])/g,'$1'); value = () => text;
    } else if (['true','false','null','undefined'].includes(token)) {
      value = () => token === 'true' ? true : token === 'false' ? false : token === 'null' ? null : undefined;
    } else if (token === 'e') { value = event => event; }
    else {
      let name = token;
      if (peek() === '.') { index++; name += '.'+tokens[index++]; }
      const fn = Object.prototype.hasOwnProperty.call(functions, name) ? functions[name] : undefined; if (!fn) throw new Error('Función no admitida en validación: '+String(name));
      expect('('); const args: Value[] = [];
      if (peek() !== ')') { do { args.push(parse(0)); if (peek() !== ',') break; index++; } while (true); }
      expect(')'); value = event => fn(...args.map(arg=>arg(event)));
    }
    while (peek() === '.' || peek() === '[') {
      const kind = tokens[index++]; const parent = value;
      if (kind === '.') { const key = tokens[index++]; value = event => member(parent(event), key); }
      else { const key = parse(0); expect(']'); value = event => member(parent(event), key(event)); }
    }
    depth--; return value;
  }
  function binary(op: string, left: unknown, right: unknown): unknown {
    switch (op) {
      case '===': return left === right; case '!==': return left !== right;
      case '==': return left == right; case '!=': return left != right;
      case '<': return typeof left==='string' && typeof right==='string' ? left<right : Number(left)<Number(right);
      case '>': return typeof left==='string' && typeof right==='string' ? left>right : Number(left)>Number(right);
      case '<=': return typeof left==='string' && typeof right==='string' ? left<=right : Number(left)<=Number(right);
      case '>=': return typeof left==='string' && typeof right==='string' ? left>=right : Number(left)>=Number(right);
      case '+': return typeof left==='string' || typeof right==='string' ? String(left)+String(right) : Number(left)+Number(right);
      case '-': return Number(left)-Number(right); case '*': return Number(left)*Number(right);
      case '/': return Number(left)/Number(right); case '%': return Number(left)%Number(right);
      default: throw new Error('Operador no admitido.');
    }
  }
  function parse(minimum: number): Value {
    let left = primary();
    while (precedence[peek()] !== undefined && precedence[peek()] >= minimum) {
      const op = tokens[index++]; const a = left; const right = parse(precedence[op]+1);
      left = event => op === '&&' ? a(event) && right(event) : op === '||' ? a(event) || right(event)
        : op === '??' ? a(event) ?? right(event) : binary(op,a(event),right(event));
    }
    if (minimum === 0 && peek() === '?') {
      index++; const condition = left; const yes = parse(0); expect(':'); const no = parse(0);
      left = event => condition(event) ? yes(event) : no(event);
    }
    return left;
  }
  const evaluate = parse(0);
  if (index !== tokens.length) throw new Error('Expresión de validación incompleta o no admitida.');
  return event => Boolean(evaluate(event));
}
