/// <reference types="webpack" />
import * as Wp from "webpack";
import * as Rx from "@reactivex/rxjs";
export declare namespace Ez {
    type Configurator = (config: Wp.Configuration) => void;
    type WatchController = (watch: Wp.Compiler.Watching) => void;
    enum Mode {
        Once = 0,
        Watch = 1,
    }
    function typescript(): Configurator;
    function babel(): Configurator;
    interface Config {
        from?: string;
        to?: string;
        configurators?: Array<Configurator>;
        mode?: Mode;
        watchController?: WatchController;
    }
    function webpack(ezConfig?: Config): Rx.Observable<Wp.Stats>;
}
