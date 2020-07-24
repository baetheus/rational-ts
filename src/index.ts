/**
 * Safe modulus operator. Javascript % is actually the remainder
 * operator and can return negative values. A true modulus operator
 * can only return positive values. Here we implement a safe version
 * of the modulus operator.
 *
 * @example
 * mod(-21, 4) // returns 3 instead of -1
 */
export const mod = (a: number, m: number): number => ((a % m) + m) % m;

/**
 * Parses a value to an integer. Returns 0 if unparseable.
 *
 * @todo This is a stopgap. Ideally, this should return Option<number>
 * and default NaN to none.
 */
export const parseDecInt = (a: string): number => {
  const parsed = parseInt(a, 10);
  if (isNaN(parsed)) {
    return 0;
  }
  return parsed;
};

/**
 * Parses a value to an float. Returns 0 if unparseable.
 *
 * @todo This is a stopgap. Ideally, this should return Option<number>
 * and default NaN to none.
 */
export const parseDecFloat = (a: string): number => {
  const parsed = parseFloat(a);
  if (isNaN(parsed)) {
    return 0;
  }
  return parsed;
};

/**
 * Math for Rational Numbers Found Below
 */
export interface Rational {
  numerator: number;
  denominator: number;
}

export const rational = (
  numerator: number = 0,
  denominator: number = 1
): Rational => ({
  numerator: denominator === 0 ? 0 : numerator,
  denominator: denominator === 0 ? 1 : denominator,
});

/**
 * Recursive greatest common divisor within epsilon size.
 * This is used to approximate floats as a rational number
 * within some distance (or decimal distance).
 * A rational number cannot always represent a float
 * value cleanly.
 */
export const approxGCD = (x: number, y: number, epsilon = 1 / 10000) => {
  const foldGCD = (a: number, b: number): number =>
    b < epsilon ? a : foldGCD(b, a % b);
  return foldGCD(Math.abs(x), Math.abs(y));
};

/**
 * Recursive strict greatest common divisor algorithm
 * https://hbfs.wordpress.com/2013/12/10/the-speed-of-gcd/
 */
export const GCD = (x: number, y: number): number =>
  y === 0 ? x : GCD(Math.floor(y), Math.floor(mod(x, y)));

/**
 * Given a string representation of a number (float or int), return an approximate
 * Rational representation within epsilon distance. Default distance has a float
 * precision of 2 digits in base 10.
 *
 * Zero is represented as a numerator of 0 with a denominator of 1
 */
export const fromString = (n: string, epsilon = 1 / 10000): Rational => {
  const float = parseDecFloat(n);
  const gcd = approxGCD(1, float, epsilon);
  return rational(Math.floor(float / gcd), Math.floor(1 / gcd));
};

/**
 * Given a number find a rational number within epsilon distance
 */
export const fromNumber = (n: number, epsilon = 1 / 10000): Rational => {
  const gcd = approxGCD(1, n, epsilon);
  return rational(Math.floor(n / gcd), Math.floor(1 / gcd));
};

/**
 * Return the runtime float representation of a rational number.
 */
export const getFloat = ({ numerator, denominator }: Rational): number =>
  numerator / denominator;

/**
 * Given a Rational number, return the integer portion
 * of the float in base 10. Uses the runtime ceil or floor operations
 * to remove trailing decimal
 */
export const getInt = (r: Rational): number => {
  const float = getFloat(r);
  return float < 0 ? Math.ceil(float) : Math.floor(float);
};

/**
 * Return the fractional portion of a Rational number (numbers to right of decimal point)
 * string integer less than or equal to n digits in length. Will always return a positive
 * value.
 */
export const getFrac = (r: Rational, precision: number = 2): string => {
  const int = getInt(r);
  const float = getFloat(r);
  const modulus = Math.pow(10, Math.abs(Math.floor(precision)));
  const shifted = (float - int) * modulus;
  return Math.abs(shifted).toFixed(0).padStart(precision);
};

/**
 * Return the runtime string representation with precision digits.
 */
export const getString = (r: Rational, precision: number = 2): string => {
  const integer = getInt(r).toString();
  const paddedDecimalString = getFrac(r, precision);
  return `${integer}.${paddedDecimalString}`;
};

/**
 * Reduce rational number
 *
 * This algorithm relies on GCD being fast, which it should be,
 * however, if the rational number math starts being a performance
 * problem this is a likely candidate for improvement
 */
export const reduce = (r: Rational): Rational => {
  let { numerator, denominator } = r;
  let gcd = GCD(numerator, denominator);
  while (gcd !== 0 && gcd !== 1) {
    numerator = numerator / gcd;
    denominator = denominator / gcd;
    gcd = GCD(numerator, denominator);
  }
  return rational(numerator, denominator);
};

/**
 * Add rational numbers
 *
 * @todo Consider reduce prior to addition algorithm
 */
export const add = (a: Rational, b: Rational): Rational =>
  reduce(
    rational(
      a.numerator * b.denominator + b.numerator * a.denominator,
      a.denominator * b.denominator
    )
  );

/**
 * Subtract rational numbers
 *
 * @todo Consider reduce prior to addition algorithm
 */
export const subtract = (a: Rational, b: Rational): Rational =>
  reduce(
    rational(
      a.numerator * b.denominator - b.numerator * a.denominator,
      a.denominator * b.denominator
    )
  );

/**
 * Multiply rational numbers
 *
 * @todo Consider reduce prior to multiplication algorithm
 */
export const multiply = (a: Rational, b: Rational): Rational =>
  reduce(rational(a.numerator * b.numerator, a.denominator * b.denominator));

/**
 * Multiply a rational number by a scalar
 */
export const scale = (a: number, x: Rational): Rational =>
  reduce(multiply(fromNumber(a), x));

/**
 * Divide rational numbers
 */
export const divide = (a: Rational, b: Rational): Rational =>
  reduce(rational(a.numerator * b.denominator, b.numerator * a.denominator));

/**
 * Equality
 */
export const equal = (a: Rational, b: Rational): boolean => {
  const _a = reduce(a);
  const _b = reduce(b);
  return _a.numerator === _b.numerator && _a.denominator === _b.denominator;
};

/**
 * Greater than
 */
export const greaterThan = (a: Rational, b: Rational): boolean => {
  /**
   * p / q > s / t
   * p * t ><? s * q
   * (p * t) - (s * q) ><? 0
   */
  const discriminant =
    a.numerator * b.denominator - b.numerator * a.denominator;
  /**
   * When multiplying across inequalities the inequality flips if the multiplier
   * is negative.
   */
  const sign = (a.denominator < 0 ? -1 : 1) * (b.denominator < 0 ? -1 : 1);
  return sign * discriminant > 0;
};

/**
 * Less than
 */
export const lessThan = (a: Rational, b: Rational): boolean =>
  greaterThan(b, a);

/**
 * Greater than or equal to
 */
export const greatThanOrEqual = (a: Rational, b: Rational): boolean =>
  greaterThan(a, b) || equal(a, b);

/**
 * Less than or equal to
 */
export const lessThanOrEqual = (a: Rational, b: Rational): boolean =>
  lessThan(a, b) || equal(a, b);

/**
 * Minimum
 */
export const minimum = (a: Rational, b: Rational): Rational =>
  lessThan(a, b) ? a : b;

/**
 * Maximum
 */
export const maximum = (a: Rational, b: Rational): Rational =>
  greaterThan(a, b) ? a : b;
