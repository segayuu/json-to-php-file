import { execFileSync } from "node:child_process";

const TITLE = `
# Benchmarks

Benchmarks performed on:
- native **JSON.stringify**
- **fast-json-stringify**
`;

console.log(TITLE);

console.log("## small-object \n\n");
console.log(execFileSync("node", ["./benchmark/small-object.mjs"]).toString());

console.log("## small-array \n\n");
console.log(execFileSync("node", ["./benchmark/small-array.mjs"]).toString());

console.log("## nested-props-short-text \n\n");
console.log(
  execFileSync("node", ["./benchmark/nested-props-short-text.mjs"]).toString()
);

console.log("## much-props-short-text \n\n");
console.log(
  execFileSync("node", ["./benchmark/much-props-short-text.mjs"]).toString()
);

console.log("## much-props-big-text \n\n");
console.log(
  execFileSync("node", ["./benchmark/much-props-big-text.mjs"]).toString()
);

console.log("## big-text \n\n");
console.log(execFileSync("node", ["./benchmark/big-text.mjs"]).toString());

console.log("## big-array-short-text \n\n");
console.log(
  execFileSync("node", ["./benchmark/big-array-short-text.mjs"]).toString()
);

console.log("## big-array-long-text \n\n");
console.log(
  execFileSync("node", ["./benchmark/big-array-long-text.mjs"]).toString()
);

console.log("## big-array-long-number \n\n");
console.log(
  execFileSync("node", ["./benchmark/big-array-long-number.mjs"]).toString()
);

console.log("## undefined properties \n\n");
console.log(execFileSync("node", ["./benchmark/undef.mjs"]).toString());
