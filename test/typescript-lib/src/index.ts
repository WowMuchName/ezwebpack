import {Module1} from "./moduleA"
import {Module2} from "./module2"

console.log(`9 - 7  = ${new Module1(9).sub(7)}`);
console.log(`9 + 7 = ${new Module2(9).add(7)}`);

export {Module1, Module2}