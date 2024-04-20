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

/**
 * Object.prototype.hasOwnProperty()  
 * 返回一个布尔值，表示对象自有属性（而不是继承来的属性）中是否具有指定的属性。
 */
let obj1 = {a: 'a'}
console.log(obj1.hasOwnProperty('a'))  // true
console.log(obj1.hasOwnProperty('toString')) // false