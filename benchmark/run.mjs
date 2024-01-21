import { execFileSync } from "node:child_process";

const TITLE = `
# Benchmarks

Benchmarks performed on:
- native **JSON.stringify**
- **fast-json-stringify**
`;

console.log(TITLE);

console.log("## small-object \n\n");
console.log(
  execFileSync("node", [
    "--expose_gc",
    "./benchmark/small-object.mjs",
  ]).toString()
);

console.log("## small-array \n\n");
console.log(
  execFileSync("node", [
    "--expose_gc",
    "./benchmark/small-array.mjs",
  ]).toString()
);

console.log("## nested-props-short-text \n\n");
console.log(
  execFileSync("node", [
    "--expose_gc",
    "./benchmark/nested-props-short-text.mjs",
  ]).toString()
);

console.log("## much-props-short-text \n\n");
console.log(
  execFileSync("node", [
    "--expose_gc",
    "./benchmark/much-props-short-text.mjs",
  ]).toString()
);

console.log("## much-props-big-text \n\n");
console.log(
  execFileSync("node", [
    "--expose_gc",
    "./benchmark/much-props-big-text.mjs",
  ]).toString()
);

console.log("## big-text \n\n");
console.log(
  execFileSync("node", ["--expose_gc", "./benchmark/big-text.mjs"]).toString()
);

console.log("## big-array-short-text \n\n");
console.log(
  execFileSync("node", [
    "--expose_gc",
    "./benchmark/big-array-short-text.mjs",
  ]).toString()
);

console.log("## big-array-long-text \n\n");
console.log(
  execFileSync("node", [
    "--expose_gc",
    "./benchmark/big-array-long-text.mjs",
  ]).toString()
);

console.log("## big-array-long-number \n\n");
console.log(
  execFileSync("node", [
    "--expose_gc",
    "./benchmark/big-array-long-number.mjs",
  ]).toString()
);

console.log("## undefined properties \n\n");
console.log(
  execFileSync("node", ["--expose_gc", "./benchmark/undef.mjs"]).toString()
);
