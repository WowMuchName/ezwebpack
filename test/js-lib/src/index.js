import {Module1} from "./module1.js"
import {Module2} from "./module2.js"

console.log(Module1);
console.log(Object.getOwnPropertyNames(Module1));
console.log(typeof Module1);

console.log(`9 - 7  = ${new Module1(9).sub(7)}`);
console.log(`9 + 7 = ${new Module2(9).add(7)}`);

export {Module1, Module2}