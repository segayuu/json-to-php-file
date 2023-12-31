import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["./src/index.mts"],
  outfile: "./dest/index.mjs",
  target: "node20",
  bundle: true,
  format: "esm",
  minify: true,
  sourcemap: "linked",
  mangleProps: /_$/,
});
