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

export interface Options {
  initalBufferSize?: number;
  shortArraySyntax?: boolean;
}

const encoder = new TextEncoder();
const phpSingleQuotedStringEscapeRegexp = /[\\']/g;

/**
 * Ascii(utf8) "null" (not "\0" null char).
 */
const asciiNull = Uint8Array.from([110, 117, 108, 108]);

/**
 * Ascii(utf8) "true".
 */
const asciiTrue = Uint8Array.from([116, 114, 117, 101]);

/**
 * Ascii(utf8) "false".
 */
const asciiFalse = Uint8Array.from([102, 97, 108, 115, 101]);

/**
 * Ascii "array("
 */
const legacyArrayStart = Uint8Array.from([97, 114, 114, 97, 121, 40]);

/**
 * Ascii "["
 */
const shortArrayStart = Uint8Array.of(91);

/**
 * Ascii "=>"
 */
const keyValueSeparator = Uint8Array.of(61, 62);

/**
 * Ascii "<?php return ".
 */
const asciiPHPIncludeFilePrefix = Uint8Array.from([
  60, 63, 112, 104, 112, 32, 114, 101, 116, 117, 114, 110, 32,
]);

/**
 * Ascii ";"
 */
const asciiPHPIncludeFileSuffix = Uint8Array.of(59);

/**
 * Ascii "]"
 */
const shortArrayEnd = Uint8Array.of(93);

/**
 * Ascii ")"
 */
const legacyArrayEnd = Uint8Array.of(41);

/**
 * Ascii ","
 */
const asciiComma = Uint8Array.of(44);

const growBuffer = (array: Uint8Array, minLength: number = 0): Uint8Array => {
  const length = Math.max(minLength, array.buffer.byteLength * 2);
  const newArray = new Uint8Array(length);
  newArray.set(array);
  return newArray;
};

const throwCircularError = (): never => {
  throw TypeError("Circular reference in value argument not supported.");
};

export const jsonToPHP = (
  value: ReadonlyJSONValue,
  options?: Readonly<Options>
): Uint8Array => {
  let bufArray = new Uint8Array(
    new ArrayBuffer((options?.initalBufferSize ?? 100) | 0)
  );
  let useLength = 0;
  const arrayStart = options?.shortArraySyntax
      ? shortArrayStart
      : legacyArrayStart,
    arrayEnd = options?.shortArraySyntax ? shortArrayEnd : legacyArrayEnd;
  const appendBuffer = (buf: Uint8Array): void => {
    const pos = useLength;
    useLength += buf.byteLength;
    if (bufArray.byteLength < useLength) {
      bufArray = growBuffer(bufArray, useLength);
    }
    bufArray.set(buf, pos);
  };
  /**
   * append Ascii(utf8) (unsafe).
   */
  const appendBufferAscii = (str: string): void => {
    const offset = useLength;
    useLength += str.length;
    if (bufArray.byteLength < useLength) {
      bufArray = growBuffer(bufArray, useLength);
    }
    encoder.encodeInto(str, bufArray.subarray(offset));
  };
  /**
   * Append PHP single quoted string.
   *
   * PHP Single quoted string is simple escape.
   * @see https://www.php.net/manual/en/language.types.string.php#language.types.string.syntax.single
   */
  const appendPHPstring = (str: string): void => {
    const escapedValue =
        "'" + str.replace(phpSingleQuotedStringEscapeRegexp, "\\$&") + "'",
      length = escapedValue.length;
    let iResult = encoder.encodeInto(
        escapedValue,
        bufArray.subarray(useLength)
      ),
      read = iResult.read;
    useLength += iResult.written;
    if (read >= length) return;
    bufArray = growBuffer(bufArray, bufArray.byteLength + (length - read) * 2);
    iResult = encoder.encodeInto(
      escapedValue.substring(read),
      bufArray.subarray(useLength)
    );
    read += iResult.read;
    useLength += iResult.written;
    if (read >= length) return;
    bufArray = growBuffer(bufArray, bufArray.byteLength + (length - read) * 3);
    useLength += encoder.encodeInto(
      escapedValue.substring(read),
      bufArray.subarray(useLength)
    ).written;
  };
  const transform = (value: unknown, refs: WeakSet<object>): void => {
    if (value === null || value === void 0) {
      appendBuffer(asciiNull);
      return;
    }
    switch (typeof value) {
      case "string":
        appendPHPstring(value);
        return;
      case "number":
        Number.isFinite(value)
          ? appendBufferAscii(value.toString())
          : appendBuffer(asciiNull);
        return;
      case "boolean":
        appendBuffer(value ? asciiTrue : asciiFalse);
        return;
      case "bigint":
        throw TypeError("BigInt value can't be serialized.");
      case "object":
        if ((Array.isArray as (arg: unknown) => arg is unknown[])(value)) {
          const length = value.length;
          let i = -1;
          appendBuffer(arrayStart);
          if (refs.has(value)) throwCircularError();
          refs.add(value);
          while (++i < length) {
            if (i !== 0) appendBuffer(asciiComma);
            transform(value[i], refs);
          }
          refs.delete(value);
          appendBuffer(arrayEnd);
        }
        switch (Object.prototype.toString.call(value)) {
          case "[object Object]": {
            let key: string,
              needComma = false;
            appendBuffer(arrayStart); // "[" or "array("
            if (refs.has(value)) throwCircularError();
            refs.add(value);
            for (key in value) {
              const objValue = (value as ReadonlyUnknownRecord)[key];
              switch (typeof objValue) {
                case "function":
                case "symbol":
                case "bigint":
                case "undefined":
                  continue;
              }
              if (needComma) appendBuffer(asciiComma);
              needComma = true;
              appendPHPstring(key);
              appendBuffer(keyValueSeparator);
              transform(objValue, refs);
            }
            refs.delete(value);
            appendBuffer(arrayEnd);
            return;
          }
          case "[object String]":
          case "[object Number]":
          case "[object Boolean]":
            transform(value.valueOf(), refs);
            return;
          case "[object Date]":
            appendPHPstring((value as Date).toISOString());
            return;
        }
    }
  };
  appendBuffer(asciiPHPIncludeFilePrefix);
  transform(value, new WeakSet<object>());
  appendBuffer(asciiPHPIncludeFileSuffix);
  // Trim ArrayBuffer.
  return bufArray.subarray(0, useLength);
};
export default jsonToPHP;
