const path = require("path");
const Ez = require("./../dist/index.js").Ez;

Ez.webpack({
    root: "test/js-lib"
}).subscribe(() => {
    console.log("result");
});