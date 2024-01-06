import self from "../dest/index.mjs";
import tinybench from "tinybench";
import json2php from "json2php";

const obj = {
  iris: Array(5)
    .fill(0)
    .map(() => ({
      sepalLength: (Math.random() * 1000).toFixed(3),
      sepalWidth: (Math.random() * 1000).toFixed(3),
      petalLength: (Math.random() * 1000).toFixed(3),
      petalWidth: (Math.random() * 1000).toFixed(3),
      species: "setosa",
    })),
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
