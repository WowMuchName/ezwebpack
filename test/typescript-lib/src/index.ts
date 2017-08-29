import {Module1} from "./moduleA"
import {Module2} from "./module2"
import * as Rx from "rxjs"

console.log(`9 - 7 = ${new Module1(9).sub(7)}`);
console.log(`9 + 7 = ${new Module2(9).add(7)}`);

console.log(`${Rx}`)

export {Module1, Module2}