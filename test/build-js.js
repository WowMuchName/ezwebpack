const path = require("path");
const Ez = require("./../dist/index.js").Ez;

process.chdir(path.resolve(__dirname, "./js-lib"));
Ez.webpack().subscribe(() => {
    console.log("result");
});