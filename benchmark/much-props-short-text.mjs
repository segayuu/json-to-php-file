import self from "../dest/index.mjs";
import tinybench from "tinybench";
import json2php from "json2php";

const obj = {
  I: "see",
  trees: "of grees",
  red: "roses, too",
  I_see: "them bloom",
  for: "me and you",
  and: "I think",
  to: "myself",
  what: "a wonderful World",

  the: "colors",
  of: "the rainbow",
  so: "pretty",
  in: "the sky",
  Are: "also on the",
  faces: "of people",
  going: "by",
};

const encoder = new TextEncoder();
const bench = new tinybench();

bench.add("self", () => {
  self(obj);
});
bench.add("json2php", () => {
  encoder.encode(`<?php return ${json2php(obj)};`);
});

await bench.run();

console.table(bench.table());
