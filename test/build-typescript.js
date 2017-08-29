const path = require("path");
const Ez = require("./../dist/index.js").Ez;
Ez.webpack({
    root: "test/typescript-lib",
    from: "src/index.ts",
    configurators: [Ez.typescript({
        tsoptions: {
            inlineSourceMap: true,
        }
    })]
}).subscribe(() => {
    console.log("result");
});
