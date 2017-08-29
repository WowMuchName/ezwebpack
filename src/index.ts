import * as Wp from "webpack";
import * as Rx from "@reactivex/rxjs";
import * as chalk from "chalk";
import path = require("path");
import fs = require("fs");
import {CompilerOptions} from "typescript";

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
    let api: Ez.ConfiguratorApi = {
        resolve: (relpath: string) => path.resolve(conf.root, relpath)
    }

    let inputExtension = path.extname(conf.from);
    let config: Wp.Configuration = {
        entry: conf.from,
        resolve: {
            extensions: [inputExtension]
        },
        resolveLoader: {
        },
        output: {
            filename: path.basename(conf.to),
            path: path.dirname(conf.to)
        },
        module: {
            rules: []
        },
        context: conf.root
    };

    for(let configurator of conf.configurators) {
        configurator(config, api);
    }
    console.log((chalk as any) `{bold.white ezWebpack} {white produced this config:}`);
    console.log((chalk as any) `{gray ${JSON.stringify(config, null, 2)}}`);
    return config;
}

export namespace Ez {
    export type Configurator = (config: Wp.Configuration, api: ConfiguratorApi) => void;
    export type WatchController = (watch: Wp.Compiler.Watching) => void;

    export interface ConfiguratorApi {
        resolve(path: string): string
    }

    export enum Mode {
        Once,
        Watch,
    }
    
    export interface TypeScriptOpts {
        tsconfig?: string;
        tsoptions?: CompilerOptions;
    }

    export function typescript(opt: TypeScriptOpts = {}): Configurator {
        return (config, api) => {
            let rule: Wp.Rule = {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: "ts-loader",
                options: {}
            };
            let opts = (rule as any).options = ((rule as any).options || {});
            if(opt.tsconfig) {
                rule.options.configFile = api.resolve(opt.tsconfig);
            }
            if(opt.tsoptions) {
                rule.options.compilerOptions = opt.tsoptions;
                if(rule.options.compilerOptions.rootDir) {
                    rule.options.compilerOptions.rootDir = api.resolve(rule.options.compilerOptions.rootDir);
                }
            }
            (config.module as Wp.NewModule).rules.push(rule);
            pushIfNotPresent(config.resolve.extensions, ".ts", ".tsx", ".js");
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
        root?: string,
        from?: string,
        to?: string,
        mode?: Mode,
        watchController?: WatchController,
        configurators?: Array<Configurator>,
    }

    export function webpack(ezConfig: Config = {}): Rx.Observable<Wp.Stats> {
        // Normalize ezConfig object
        ezConfig.root = ezConfig.root ? path.resolve(process.cwd(), ezConfig.root) : process.cwd();
        ezConfig.from = path.resolve(ezConfig.root, ezConfig.from || "src/index.js");
        ezConfig.to = path.resolve(ezConfig.root, ezConfig.to || "dist/index.js");
        ezConfig.mode = ezConfig.mode || Mode.Once;
        ezConfig.watchController = ezConfig.watchController || ((watch) => {});
        ezConfig.configurators = ezConfig.configurators || [];
        
        // Produce Webpacks config object
        let config: Wp.Configuration = produceConfig(ezConfig);
        try {
            fs.unlinkSync(ezConfig.to);
        } catch(e){
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
        let checkConfig = function() {
            if(!shownEffectiveWpConfig) {
                shownEffectiveWpConfig = true;
                console.log((chalk as any) `{bold.white Webpack} {white is using this effective config:}`);
                console.log((chalk as any) `{gray ${JSON.stringify(config, null, 2)}}`);
            }
        };
        return results.do((next) => {
    //        process.stdout.write('\x1B[2J\x1B[0f\u001b[0;0H');
            checkConfig();
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
            checkConfig();
            console.error((chalk as any) `{bold.redBright Fatal:} ${err}`);
        });
    }
}

