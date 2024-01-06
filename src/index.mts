type JSONPrimitive = string | number | boolean | null;
type ReadonlyJSONHasReferenceValue =
  | readonly ReadonlyJSONValue[]
  | ReadonlyJSONObject;
type ReadonlyJSONValue = JSONPrimitive | ReadonlyJSONHasReferenceValue;

interface ReadonlyJSONObject {
  readonly [key: string]: ReadonlyJSONValue;
}

interface ReadonlyUnknownRecord {
  readonly [key: string | number | symbol]: unknown;
}

// mangle target.
interface Context {
  buf_: Uint8Array;
  useLength_: number;
  readonly refSet_: WeakSet<object>;
  readonly shortArraySyntax_: boolean;
}

export interface Options {
  initalBufferSize?: number;
  shortArraySyntax?: boolean;
}

const encoder = new TextEncoder();
const phpSingleQuotedStringEscapeRegexp = /[\\']/g;

const validateShallowJSONValue = (
  value: unknown
): value is JSONPrimitive | readonly unknown[] | ReadonlyUnknownRecord => {
  if (value === void 0) return false;
  if (value === null) return true;
  switch (typeof value) {
    case "function":
    case "symbol":
    case "bigint":
      return false;
  }
  return true;
};

const growBuffer = (array: Uint8Array, minLength: number = 0): Uint8Array => {
  const length = Math.max(minLength, array.buffer.byteLength * 2);
  const newArray = new Uint8Array(length);
  newArray.set(array);
  return newArray;
};

const appendBufferInt8 = (context: Context, value: number): void => {
  const pos = context.useLength_;
  const newLength = pos + 1;
  let bufArray = context.buf_;
  ++context.useLength_;

  if (bufArray.byteLength < newLength) {
    context.buf_ = bufArray = growBuffer(bufArray, newLength);
  }

  bufArray[pos] = value;
};

/**
 * append Ascii(utf8) (unsafe).
 */
const appendBufferAscii = (context: Context, str: string): void => {
  const offset = context.useLength_;
  const newLength = offset + str.length;
  let bufArray = context.buf_;

  context.useLength_ = newLength;
  if (bufArray.byteLength < newLength) {
    context.buf_ = bufArray = growBuffer(bufArray, newLength);
  }

  encoder.encodeInto(str, bufArray.subarray(offset));
};

/**
 * append Ascii(utf8) "null" (not "\0" null char).
 */
const appendBufferAsciiNull = (context: Context): void => {
  const offset = context.useLength_;
  const newLength = offset + 4;
  let bufArray = context.buf_;

  context.useLength_ = newLength;
  if (bufArray.byteLength < newLength) {
    context.buf_ = bufArray = growBuffer(bufArray, newLength);
  }

  bufArray[offset] = 110; // "n"
  bufArray[offset + 1] = 117; // "u"
  bufArray[offset + 2] = 108; // "l"
  bufArray[offset + 3] = 108; // "l"
};

/**
 * append Ascii(utf8) "true".
 */
const appendBufferAsciiTrue = (context: Context): void => {
  const offset = context.useLength_;
  const newLength = offset + 4;
  let bufArray = context.buf_;

  context.useLength_ = newLength;
  if (bufArray.byteLength < newLength) {
    context.buf_ = bufArray = growBuffer(bufArray, newLength);
  }

  bufArray[offset] = 116; // "t"
  bufArray[offset + 1] = 114; // "r"
  bufArray[offset + 2] = 117; // "u"
  bufArray[offset + 3] = 101; // "e"
};

/**
 * append Ascii(utf8) "false".
 */
const appendBufferAsciiFalse = (context: Context): void => {
  const offset = context.useLength_;
  const newLength = offset + 5;
  let bufArray = context.buf_;

  context.useLength_ = newLength;
  if (bufArray.byteLength < newLength) {
    context.buf_ = bufArray = growBuffer(bufArray, newLength);
  }

  bufArray[offset] = 102; // "f"
  bufArray[offset + 1] = 97; // "a"
  bufArray[offset + 2] = 108; // "l"
  bufArray[offset + 3] = 115; // "s"
  bufArray[offset + 4] = 101; // "e"
};

/**
 * Append PHP single quoted string.
 *
 * PHP Single quoted string is simple escape.
 * @see https://www.php.net/manual/en/language.types.string.php#language.types.string.syntax.single
 */
const appendPHPstring = (context: Context, str: string): void => {
  const escapedValue = str.replaceAll(
    phpSingleQuotedStringEscapeRegexp,
    "\\$&"
  );
  const { length } = escapedValue;
  appendBufferInt8(context, 39); // "'"

  const offset = context.useLength_;
  let bufArray = context.buf_;
  let { read, written } = encoder.encodeInto(
    escapedValue,
    bufArray.subarray(offset)
  );
  if (read < length) {
    context.buf_ = bufArray = growBuffer(
      bufArray,
      bufArray.byteLength + (length - read) * 3
    );
    written += encoder.encodeInto(
      escapedValue.substring(read),
      bufArray.subarray(offset + written)
    ).written;
  }

  context.useLength_ = offset + written;
  appendBufferInt8(context, 39); // "'"
};

const appendArrayStartSyntax = (context: Context): void => {
  if (context.shortArraySyntax_) {
    appendBufferInt8(context, 91); // "["
  } else {
    const offset = context.useLength_;
    const newLength = offset + 6;
    let bufArray = context.buf_;

    context.useLength_ = newLength;
    if (bufArray.byteLength < newLength) {
      context.buf_ = bufArray = growBuffer(bufArray, newLength);
    }

    bufArray[offset] = 97; // "a"
    bufArray[offset + 1] = 114; // "r"
    bufArray[offset + 2] = 114; // "r"
    bufArray[offset + 3] = 97; // "a"
    bufArray[offset + 4] = 121; // "y"
    bufArray[offset + 5] = 40; // "("
  }
};

/**
 * append "<?php return ".
 */
const appendAsciiPHPIncludeFilePrefix = (context: Context): void => {
  const offset = context.useLength_;
  const newLength = offset + 13;
  let bufArray = context.buf_;

  context.useLength_ = newLength;
  if (bufArray.byteLength < newLength) {
    context.buf_ = bufArray = growBuffer(bufArray, newLength);
  }

  bufArray[offset] = 60; // "<"
  bufArray[offset + 1] = 63; // "?"
  bufArray[offset + 2] = 112; // "p"
  bufArray[offset + 3] = 104; // "h"
  bufArray[offset + 4] = 112; // "p"
  bufArray[offset + 5] = 32; // SP
  bufArray[offset + 6] = 114; // "r"
  bufArray[offset + 7] = 101; // "e"
  bufArray[offset + 8] = 116; // "t"
  bufArray[offset + 9] = 117; // "u"
  bufArray[offset + 10] = 114; // "r"
  bufArray[offset + 11] = 110; // "n"
  bufArray[offset + 12] = 32; // SP
};

const nestWithArray = (context: Context, array: readonly unknown[]): void => {
  appendArrayStartSyntax(context); // "[" or "array("

  const { length } = array;
  for (let i = 0; i < length; ++i) {
    if (i !== 0) appendBufferInt8(context, 44); // ","
    const value = array[i];
    validateShallowJSONValue(value)
      ? transform(context, value)
      : appendBufferAsciiNull(context);
  }
  appendBufferInt8(context, context.shortArraySyntax_ ? 93 : 41); // "]" : ")"
};

const nestWithPlainObject = (
  context: Context,
  obj: ReadonlyUnknownRecord
): void => {
  appendArrayStartSyntax(context); // "[" or "array("
  const keys = Object.keys(obj);
  const { length } = keys;

  for (let i = 0, needComma = false; i < length; ++i) {
    const key = keys[i]!;
    const value = obj[key];
    if (!validateShallowJSONValue(value)) continue;
    if (needComma) appendBufferInt8(context, 44); // ","
    appendPHPstring(context, key);

    const offset = context.useLength_;
    const bufNewLength = offset + 2;
    let bufArray = context.buf_;

    context.useLength_ = bufNewLength;
    if (bufArray.byteLength < bufNewLength) {
      context.buf_ = bufArray = growBuffer(bufArray, bufNewLength);
    }

    bufArray[offset] = 61; // "="
    bufArray[offset + 1] = 62; // ">"

    transform(context, value);

    needComma = true;
  }
  appendBufferInt8(context, context.shortArraySyntax_ ? 93 : 41); // "]" : ")"
};

const transform = (context: Context, value: unknown): void => {
  if (value === null || value === void 0) {
    appendBufferAsciiNull(context);
    return;
  }
  if (value === true) {
    appendBufferAsciiTrue(context);
    return;
  }
  if (value === false) {
    appendBufferAsciiFalse(context);
    return;
  }
  if (Number.isFinite(value)) {
    appendBufferAscii(context, JSON.stringify(value as number));
    return;
  }
  switch (typeof value) {
    case "string":
      appendPHPstring(context, value);
      return;
    case "number":
      // NaN or Infinity.
      appendBufferAsciiNull(context);
      return;
    case "bigint":
      throw TypeError("BigInt value can't be serialized.");
    case "object":
      if (context.refSet_.has(value)) {
        throw TypeError("Circular reference in value argument not supported.");
      }
      context.refSet_.add(value);
      if ((Array.isArray as (arg: unknown) => arg is unknown[])(value)) {
        nestWithArray(context, value);
      } else if (value instanceof Date) {
        appendPHPstring(context, value.toISOString());
      } else if (
        value instanceof Number ||
        value instanceof Boolean ||
        value instanceof String
      ) {
        transform(context, value.valueOf());
      } else {
        nestWithPlainObject(context, value as ReadonlyUnknownRecord);
      }
      context.refSet_.delete(value);
      return;
  }
};

const initContext = (options?: Readonly<Options>): Context => {
  const context = Object.create(null) as {
    buf_: Uint8Array;
    useLength_: number;
    refSet_: WeakSet<object>;
    shortArraySyntax_: boolean;
  };
  const initalBufferSize = (options?.initalBufferSize ?? 1920) | 0;
  context.buf_ = new Uint8Array(new ArrayBuffer(initalBufferSize));
  context.useLength_ = 0;
  context.refSet_ = new WeakSet<object>();
  context.shortArraySyntax_ = !!options?.shortArraySyntax;
  return context;
};

export const jsonToPHP = (
  value: ReadonlyJSONValue,
  options?: Readonly<Options>
): Uint8Array => {
  const context = initContext(options);
  appendAsciiPHPIncludeFilePrefix(context);
  transform(context, value);
  appendBufferInt8(context, 59);
  // Trim ArrayBuffer.
  return context.buf_.slice(0, context.useLength_);
};
export default jsonToPHP;
