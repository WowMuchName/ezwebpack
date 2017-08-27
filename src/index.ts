import * as Wp from "webpack";
import * as Rx from "@reactivex/rxjs";
import * as chalk from "chalk";
import path = require("path");
import fs = require("fs");

function watch(config: Wp.Configuration, results: Rx.Subject<Wp.Stats>, watchController?: Ez.WatchController) {
    let watch: Wp.Watching = Wp(config).watch({}, (err, stats) => {
        if(err) {
            return results.error(err);
        }
        results.next(stats);
    });
    if(watchController) {
        watchController(watch);
    }
}

function build(config: Wp.Configuration, results: Rx.Subject<Wp.Stats>) {
    Wp(config, (err, stats) => {
        if(err) {
            return results.error(err);
        }
        if(stats.hasErrors()) {
            return results.error(stats);
        }
        results.next(stats);
        results.complete();
    });
}

function pushIfNotPresent<T>(arr: Array<T>, ... objects: Array<T>) {
    for(let obj of objects) {
        if(arr.indexOf(obj) === -1) {
            arr.push(obj);
        }
    }
}

function produceConfig(conf: Ez.Config): Wp.Configuration {
    let inputExtension = path.extname(conf.from);
    let config: Wp.Configuration = {
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
    for(let configurator of conf.configurators) {
        configurator(config);
    }
    console.log((chalk as any) `{bold.white ezWebpack} {white produced this config:}`);
    console.log((chalk as any) `{gray ${JSON.stringify(config, null, 2)}}`);
    return config;
}

export namespace Ez {
    export type Configurator = (config: Wp.Configuration) => void;
    export type WatchController = (watch: Wp.Compiler.Watching) => void;
    export enum Mode {
        Once,
        Watch,
    }
    
    export function typescript(): Configurator {
        return (config) => {
            (config.module as Wp.NewModule).rules.push({
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            });
            pushIfNotPresent(config.resolve.extensions, ".ts", ".tsx");
        };
    }
    
    export function babel(): Configurator {
        return (config) => {
            (config.module as Wp.NewModule).rules.push({
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

    export interface Config {
        from?: string,
        to?: string,
        configurators?: Array<Configurator>,
        mode?: Mode,
        watchController?: WatchController,
    }

    export function webpack(ezConfig: Config = {}): Rx.Observable<Wp.Stats> {
        // Normalize ezConfig object
        ezConfig.from = path.resolve(process.cwd(), ezConfig.from || "src/index.js");
        ezConfig.to = path.resolve(process.cwd(), ezConfig.to || "dist/index.js");
        ezConfig.mode = ezConfig.mode || Mode.Once;
        ezConfig.configurators = ezConfig.configurators || [];
        ezConfig.watchController = ezConfig.watchController || ((watch) => {});
    
        // Produce Webpacks config object
        let config: Wp.Configuration = produceConfig(ezConfig);
        try {
            fs.unlinkSync(ezConfig.to);
        } catch(e){
            console.log(e);
        }
    
        // Execute Webpack
        let results: Rx.Subject<Wp.Stats> = new Rx.Subject();
        switch(ezConfig.mode) {
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
            if(!shownEffectiveWpConfig) {
                shownEffectiveWpConfig = true;
                console.log((chalk as any) `{bold.white Webpack} {white is using this effective config:}`);
                console.log((chalk as any) `{gray ${JSON.stringify(config, null, 2)}}`);
            }
            if(next.hasErrors()) {
                console.log((chalk as any) `{white.bold.bgRed                                            }`);
                console.log((chalk as any) `{white.bold.bgRed              Module Invalid                }`);
                console.log((chalk as any) `{white.bold.bgRed                                            }`);
                console.log(next.toString({colors: true, warnings: true}));
            } else {
                console.log((chalk as any) `{white.bold.bgGreen                                            }`);
                console.log((chalk as any) `{white.bold.bgGreen               Module valid                 }`);
                console.log((chalk as any) `{white.bold.bgGreen                                            }`);
                console.log(next.toString({colors: true, warnings: true}));
            }
        }, (err) => {
            console.error((chalk as any) `{bold.redBright Fatal:} ${err}`);
        });
    }
}

