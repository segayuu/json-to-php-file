import self from "../dest/index.mjs";
import { Bench } from "tinybench";
import json2php from "json2php";

const obj = {
  I: { see: { trees: "of green" } },
  red: { roses: "too, I see" },
  them: { bloom: "for me and you" },
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
