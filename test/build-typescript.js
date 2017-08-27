const path = require("path");
const Ez = require("./../dist/index.js").Ez;

process.chdir(path.resolve(__dirname, "./typescript-lib"));

Ez.webpack({
    from: "src/index.ts",
    configurators: [Ez.typescript()]
}).subscribe(() => {
    console.log("result");
});