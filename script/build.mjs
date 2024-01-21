import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["./src/*.mts"],
  outdir: "./dest",
  target: "node20",
  bundle: true,
  format: "esm",
  minify: true,
  sourcemap: "linked",
  outExtension: {
    ".js": ".mjs",
  },
});
