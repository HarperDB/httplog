const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const y = d * 365.25;

export function ms(value, options) {
  try {
    if (typeof value === 'string') {
      return parse(value);
    }
    else if ( typeof value === 'number' ) {
      return value
    }
    throw new Error('Value provided to ms() must be a string or a number.');
  } catch (error) {
    const message = isError(error)
      ? `${error.message}. value=${JSON.stringify(value)}`
      : 'An unknown error has occurred.';
    throw new Error(message);
  }
}

/**
 * Parse the given string and return milliseconds.
 *
 * @param {string} str - A string to parse to milliseconds
 * @returns {number}
 */
export function parse(str) {
  if (typeof str !== 'string' || str.length === 0 || str.length > 100) {
    throw new Error(
      'Value provided to ms.parse() must be a string with length between 1 and 99.',
    );
  }
  const match =
    /^(?<value>-?(?:\d+)?\.?\d+) *(?<type>milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str,
    );
  const groups = match?.groups;
  if (!groups) {
    return NaN;
  }
  const n = parseFloat(groups.value);
  const type = (groups.type || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      throw new Error(
        `The unit ${type} was matched, but no matching case exists.`,
      );
  }
}

/**
 * Parse the given StringValue and return milliseconds.
 *
 * @param {string} value
 * @returns {number}
 */
function parseStrict(value) {
  return parse(value);
}



/**
 * A type guard for errors.
 *
 * @param {*} value
 * @returns {boolean}
 */
function isError(value) {
  return typeof value === 'object' && value !== null && 'message' in value;
}

