import self from "../dest/index.mjs";
import { Bench } from "tinybench";
import json2php from "json2php";

const obj = {
  hello: "pretty big object here",
  test: Array(1000)
    .fill(0)
    .map(() => ({
      a: Math.random().toString(36),
      b: Math.random().toString(36),
      c: Math.random().toString(36),
    })),
};

const encoder = new TextEncoder();
const bench = new Bench({
  setup() {
    global.gc();
  },
});
bench.add("self", () => {
  self(obj);
});
bench.add("json2php", () => {
  encoder.encode(`<?php return ${json2php(obj)};`);
});

await bench.run();

console.table(bench.table());
