"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Wp = require("webpack");
const Rx = require("@reactivex/rxjs");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
function watch(config, results, watchController) {
    let watch = Wp(config).watch({}, (err, stats) => {
        if (err) {
            return results.error(err);
        }
        results.next(stats);
    });
    if (watchController) {
        watchController(watch);
    }
}
function build(config, results) {
    Wp(config, (err, stats) => {
        if (err) {
            return results.error(err);
        }
        if (stats.hasErrors()) {
            return results.error(stats);
        }
        results.next(stats);
        results.complete();
    });
}
function pushIfNotPresent(arr, ...objects) {
    for (let obj of objects) {
        if (arr.indexOf(obj) === -1) {
            arr.push(obj);
        }
    }
}
function produceConfig(conf) {
    let inputExtension = path.extname(conf.from);
    let config = {
        entry: conf.from,
        resolve: {
            extensions: [inputExtension]
        },
        output: {
            filename: path.basename(conf.to),
            path: path.dirname(conf.to)
        },
        module: {
            rules: []
        },
    };
    for (let configurator of conf.configurators) {
        configurator(config);
    }
    console.log(chalk `{bold.white ezWebpack} {white produced this config:}`);
    console.log(chalk `{gray ${JSON.stringify(config, null, 2)}}`);
    return config;
}
var Ez;
(function (Ez) {
    let Mode;
    (function (Mode) {
        Mode[Mode["Once"] = 0] = "Once";
        Mode[Mode["Watch"] = 1] = "Watch";
    })(Mode = Ez.Mode || (Ez.Mode = {}));
    function typescript() {
        return (config) => {
            config.module.rules.push({
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            });
            pushIfNotPresent(config.resolve.extensions, ".ts", ".tsx");
        };
    }
    Ez.typescript = typescript;
    function babel() {
        return (config) => {
            config.module.rules.push({
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                },
                exclude: /(node_modules|bower_components)/
            });
            pushIfNotPresent(config.resolve.extensions, ".js");
        };
    }
    Ez.babel = babel;
    function webpack(ezConfig = {}) {
        // Normalize ezConfig object
        ezConfig.from = path.resolve(process.cwd(), ezConfig.from || "src/index.js");
        ezConfig.to = path.resolve(process.cwd(), ezConfig.to || "dist/index.js");
        ezConfig.mode = ezConfig.mode || Mode.Once;
        ezConfig.configurators = ezConfig.configurators || [];
        ezConfig.watchController = ezConfig.watchController || ((watch) => { });
        // Produce Webpacks config object
        let config = produceConfig(ezConfig);
        try {
            fs.unlinkSync(ezConfig.to);
        }
        catch (e) { }
        // Execute Webpack
        let results = new Rx.Subject();
        switch (ezConfig.mode) {
            case Mode.Watch:
                watch(config, results, ezConfig.watchController);
                break;
            case Mode.Once:
            default:
                build(config, results);
        }
        //
        let shownEffectiveWpConfig = false;
        return results.do((next) => {
            //        process.stdout.write('\x1B[2J\x1B[0f\u001b[0;0H');
            if (!shownEffectiveWpConfig) {
                shownEffectiveWpConfig = true;
                console.log(chalk `{bold.white Webpack} {white is using this effective config:}`);
                console.log(chalk `{gray ${JSON.stringify(config, null, 2)}}`);
            }
            if (next.hasErrors()) {
                console.log(chalk `{white.bold.bgRed                                            }`);
                console.log(chalk `{white.bold.bgRed              Module Invalid                }`);
                console.log(chalk `{white.bold.bgRed                                            }`);
                console.log(next.toString({ colors: true, warnings: true }));
            }
            else {
                console.log(chalk `{white.bold.bgGreen                                            }`);
                console.log(chalk `{white.bold.bgGreen               Module valid                 }`);
                console.log(chalk `{white.bold.bgGreen                                            }`);
                console.log(next.toString({ colors: true, warnings: true }));
            }
        }, (err) => {
            console.error(chalk `{bold.redBright Fatal:} ${err}`);
        });
    }
    Ez.webpack = webpack;
})(Ez = exports.Ez || (exports.Ez = {}));
