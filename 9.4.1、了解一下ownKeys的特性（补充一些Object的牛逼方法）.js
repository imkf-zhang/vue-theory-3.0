/**
 * Reflect.ownKeys    
 * Object.getOwnPropertyNames  
 * Object.getOwnPropertySymbols
 */

let  obj = {
  a: 'a',
  b: 'b',
  [Symbol.for('baz')]: 'baz'
  
}
console.log(Reflect.ownKeys(obj)) // [ 'a', 'b', Symbol(baz) ]

console.log(Object.getOwnPropertyNames(obj))  // [ 'a', 'b' ]

console.log(Object.getOwnPropertySymbols(obj)) // [ Symbol(baz) ]