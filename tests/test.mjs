import json2phpFile from "../dest/index.mjs";
import { test } from "node:test";
import { equal, throws } from "node:assert/strict";

const decoder = new TextDecoder();

test("If you give finite number you should get number.", () => {
  equal(decoder.decode(json2phpFile(1)), "<?php return 1;");
  equal(decoder.decode(json2phpFile(-1)), "<?php return -1;");
  equal(decoder.decode(json2phpFile(0)), "<?php return 0;");
  equal(decoder.decode(json2phpFile(-0)), "<?php return 0;");
});

test("If you give null or undefined or NaN or Infinity you should get null.", () => {
  const expected = "<?php return null;";
  equal(decoder.decode(json2phpFile(Number.NaN)), expected);
  equal(decoder.decode(json2phpFile(Number.POSITIVE_INFINITY)), expected);
  equal(decoder.decode(json2phpFile(Number.NEGATIVE_INFINITY)), expected);
  equal(decoder.decode(json2phpFile(undefined)), expected);
  equal(decoder.decode(json2phpFile(null)), expected);
});

test("If you give true or false you should get boolean true or false.", () => {
  equal(decoder.decode(json2phpFile(true)), "<?php return true;");
  equal(decoder.decode(json2phpFile(false)), "<?php return false;");
});

test("If you give function or symbol you should return empty array.", () => {
  const expected = "<?php return ;";
  equal(decoder.decode(json2phpFile(() => {})), expected);
  equal(decoder.decode(json2phpFile(Symbol())), expected);
});

test("If you give string you should get string.", () => {
  equal(decoder.decode(json2phpFile("a")), "<?php return 'a';");
  equal(
    decoder.decode(json2phpFile("'escaping'quotes'")),
    "<?php return '\\'escaping\\'quotes\\'';"
  );
});

test("If you give array you should get php array.", () => {
  // Single level
  equal(decoder.decode(json2phpFile([1, 2, 3])), "<?php return array(1,2,3);");
  equal(
    decoder.decode(json2phpFile(new Array(3))),
    "<?php return array(null,null,null);"
  );
  equal(
    decoder.decode(
      json2phpFile(
        Object.create(null, {
          x: { value: "x", enumerable: false },
          y: { value: "y", enumerable: true },
        })
      )
    ),
    "<?php return array('y'=>'y');"
  );
  // Multi level
  equal(
    decoder.decode(json2phpFile([1, [2], 3])),
    "<?php return array(1,array(2),3);"
  );
});

test("If you give object you should get php array of it.", () => {
  equal(decoder.decode(json2phpFile({ a: 1 })), "<?php return array('a'=>1);");
  equal(
    decoder.decode(json2phpFile({ b: "true" })),
    "<?php return array('b'=>'true');"
  );
  equal(
    decoder.decode(json2phpFile({ 1: true })),
    "<?php return array('1'=>true);"
  );
  equal(
    decoder.decode(json2phpFile({ false: true })),
    "<?php return array('false'=>true);"
  );
  equal(
    decoder.decode(json2phpFile({ a: 1, 1: true })),
    "<?php return array('1'=>true,'a'=>1);"
  );
  equal(
    decoder.decode(json2phpFile({ undefined: null })),
    "<?php return array('undefined'=>null);"
  );
  equal(decoder.decode(json2phpFile({ a: () => {} })), "<?php return array();");
  equal(
    decoder.decode(json2phpFile({ [Symbol()]: () => {} })),
    "<?php return array();"
  );
  equal(
    decoder.decode(json2phpFile({ "🍣": "🍺" })),
    "<?php return array('🍣'=>'🍺');"
  );
});

test("If you give nest object you should get php nest array of it.", () => {
  equal(
    decoder.decode(
      json2phpFile({
        name: "Noel",
        surname: "Broda",
        childrens: {
          John: { name: "John", surname: "Bainotti" },
          Tin: { name: "Tin", surname: "Tassi" },
        },
      })
    ),
    "<?php return array('name'=>'Noel','surname'=>'Broda','childrens'=>array('John'=>array('name'=>'John','surname'=>'Bainotti'),'Tin'=>array('name'=>'Tin','surname'=>'Tassi')));"
  );
});

test("If circular ref should error.", () => {
  throws(
    () => {
      const array = [];
      array[0] = array;
      json2phpFile(array);
    },
    {
      name: "TypeError",
      message: "Circular reference in value argument not supported.",
    }
  );
  throws(
    () => {
      const obj = {};
      obj.foo = obj;
      json2phpFile(obj);
    },
    {
      name: "TypeError",
      message: "Circular reference in value argument not supported.",
    }
  );
  const obj = {};
  const array = [obj, obj];
  json2phpFile(array);
});

test("enable shortArraySyntax", () => {
  equal(
    decoder.decode(json2phpFile([1, [2], 3], { shortArraySyntax: true })),
    "<?php return [1,[2],3];"
  );
  equal(
    decoder.decode(
      json2phpFile(
        { a: 1, c: "text", false: true, undefined: null },
        { shortArraySyntax: true }
      )
    ),
    "<?php return ['a'=>1,'c'=>'text','false'=>true,'undefined'=>null];"
  );
});

test("If you give should initial buffer size.", () => {
  equal(
    decoder.decode(
      json2phpFile(
        {
          name: "🍣",
          surname: "Bro'da",
          childrens: {
            John: { name: "John", surname: "Bainotti" },
            Tin: { name: "Tin", surname: "Tassi" },
          },
        },
        { initalBufferSize: 4 }
      )
    ),
    "<?php return array('name'=>'🍣','surname'=>'Bro\\'da','childrens'=>array('John'=>array('name'=>'John','surname'=>'Bainotti'),'Tin'=>array('name'=>'Tin','surname'=>'Tassi')));"
  );
});
