/**
 * Math expression parser and evaluator implementing PEMDAS:
 * - Parentheses: ( ... )
 * - Exponents: ^
 * - Multiplication & Division: *, /, % (left-to-right)
 * - Addition & Subtraction: +, - (left-to-right)
 *
 * Supports unary operators (+, -), decimal points, percentages (e.g. 20%),
 * and implicit multiplication like 2(3) or (1+1)(2+2).
 *
 * 100% pure TypeScript recursive-descent parser (NO eval or new Function).
 */

export interface MathEvalResult {
  success: boolean;
  value: number;
  error?: string;
}

type TokenType = 'NUMBER' | 'OP' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value: string;
  numValue?: number;
}

/**
 * Checks if a string contains any mathematical operators or parentheses
 */
export function hasMathExpression(input: string): boolean {
  return /[+\-*/^%()×÷]/.test(input);
}

/**
 * Tokenize a mathematical string into tokens
 */
function tokenize(input: string): Token[] {
  const sanitized = input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/·/g, '*');

  const tokens: Token[] = [];
  let i = 0;

  while (i < sanitized.length) {
    const char = sanitized[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Number (including decimal point and optional trailing %)
    if (/\d/.test(char) || (char === '.' && i + 1 < sanitized.length && /\d/.test(sanitized[i + 1]))) {
      let numStr = '';
      while (i < sanitized.length && (/\d/.test(sanitized[i]) || sanitized[i] === '.')) {
        numStr += sanitized[i];
        i++;
      }

      let isPercent = false;
      if (i < sanitized.length && sanitized[i] === '%') {
        isPercent = true;
        i++;
      }

      const parsedNum = parseFloat(numStr);
      if (isNaN(parsedNum)) {
        throw new Error(`Invalid number: ${numStr}`);
      }

      tokens.push({
        type: 'NUMBER',
        value: isPercent ? `${numStr}%` : numStr,
        numValue: isPercent ? parsedNum / 100 : parsedNum,
      });
      continue;
    }

    // Parentheses
    if (char === '(') {
      // Check for implicit multiplication: previous token was NUMBER or RPAREN
      if (tokens.length > 0) {
        const prev = tokens[tokens.length - 1];
        if (prev.type === 'NUMBER' || prev.type === 'RPAREN') {
          tokens.push({ type: 'OP', value: '*' });
        }
      }
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      // Check if followed by % (e.g. (1+2)%)
      if (i < sanitized.length && sanitized[i] === '%') {
        tokens.push({ type: 'OP', value: '%' });
        i++;
      }
      continue;
    }

    // Operators
    if (['+', '-', '*', '/', '^', '%'].includes(char)) {
      tokens.push({ type: 'OP', value: char });
      i++;
      continue;
    }

    // Unknown character
    throw new Error(`Unrecognized symbol "${char}" in expression`);
  }

  return tokens;
}

/**
 * Parser for mathematical expressions following PEMDAS
 */
class ExpressionParser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): number {
    if (this.tokens.length === 0) {
      throw new Error('Empty expression');
    }
    const result = this.parseAddSub();
    if (!this.isAtEnd()) {
      throw new Error(`Unexpected symbol "${this.peek().value}"`);
    }
    return result;
  }

  // Addition & Subtraction (lowest precedence, left-to-right)
  private parseAddSub(): number {
    let left = this.parseMulDiv();

    while (this.matchOp('+') || this.matchOp('-')) {
      const op = this.previous().value;
      const right = this.parseMulDiv();
      if (op === '+') {
        left += right;
      } else {
        left -= right;
      }
    }

    return left;
  }

  // Multiplication & Division (higher precedence than +/-, left-to-right)
  private parseMulDiv(): number {
    let left = this.parsePower();

    while (this.matchOp('*') || this.matchOp('/') || this.matchOp('%')) {
      const op = this.previous().value;
      const right = this.parsePower();

      if (op === '*') {
        left *= right;
      } else if (op === '/') {
        if (right === 0) {
          throw new Error('Division by zero');
        }
        left /= right;
      } else if (op === '%') {
        if (right === 0) {
          throw new Error('Modulo by zero');
        }
        left = left % right;
      }
    }

    return left;
  }

  // Exponents ^ (higher precedence than */, right-associative)
  private parsePower(): number {
    const base = this.parseUnary();

    if (this.matchOp('^')) {
      const exponent = this.parsePower(); // right-associative: 2^3^2 = 2^(3^2)
      return Math.pow(base, exponent);
    }

    return base;
  }

  // Unary operators (+, -)
  private parseUnary(): number {
    if (this.matchOp('+')) {
      return this.parseUnary();
    }
    if (this.matchOp('-')) {
      return -this.parseUnary();
    }
    return this.parsePrimary();
  }

  // Primary: Parentheses, Numbers
  private parsePrimary(): number {
    if (this.matchType('LPAREN')) {
      const expr = this.parseAddSub();
      if (!this.matchType('RPAREN')) {
        throw new Error('Unclosed parenthesis ")"');
      }
      return expr;
    }

    if (this.matchType('NUMBER')) {
      const num = this.previous().numValue;
      if (typeof num === 'number' && !isNaN(num)) {
        return num;
      }
      throw new Error('Invalid number');
    }

    if (this.isAtEnd()) {
      throw new Error('Incomplete expression');
    }

    throw new Error(`Unexpected token "${this.peek().value}"`);
  }

  private matchOp(op: string): boolean {
    if (this.checkOp(op)) {
      this.advance();
      return true;
    }
    return false;
  }

  private checkOp(op: string): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    return token.type === 'OP' && token.value === op;
  }

  private matchType(type: TokenType): boolean {
    if (!this.isAtEnd() && this.peek().type === type) {
      this.advance();
      return true;
    }
    return false;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}

/**
 * Cleans floating point representation issues (e.g. 0.1 + 0.2 = 0.3)
 */
export function cleanFloat(val: number): number {
  if (!isFinite(val) || isNaN(val)) return 0;
  // Round to 4 decimal places maximum
  const rounded = Math.round((val + Number.EPSILON) * 10000) / 10000;
  // If it's effectively 2 decimal places, keep it clean
  const twoDec = Math.round((val + Number.EPSILON) * 100) / 100;
  if (Math.abs(rounded - twoDec) < 1e-6) {
    return twoDec;
  }
  return rounded;
}

/**
 * Evaluates a mathematical expression string according to PEMDAS.
 * Returns { success: true, value } or { success: false, error }
 */
export function evaluateMathExpression(input: string): MathEvalResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: true, value: 0 };
  }

  try {
    const tokens = tokenize(trimmed);
    const parser = new ExpressionParser(tokens);
    const rawResult = parser.parse();

    if (isNaN(rawResult) || !isFinite(rawResult)) {
      return { success: false, value: 0, error: 'Result is undefined or infinite' };
    }

    return {
      success: true,
      value: cleanFloat(rawResult),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid math expression';
    return {
      success: false,
      value: 0,
      error: msg,
    };
  }
}
