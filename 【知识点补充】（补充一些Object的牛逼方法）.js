/*
 * @Author: zhangkaifan 15638452918@163.com
 * @Date: 2024-04-27 08:27:40
 * @LastEditors: zhangkaifan 15638452918@163.com
 * @LastEditTime: 2024-05-01 10:56:32
 * @FilePath: \vue-theory-3.0\【知识点补充】（补充一些Object的牛逼方法）.js
 * @Description: 
 * 
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved. 
 */



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

/**
 * TODO:  那我感觉目前解决for in  使用Symbol创造的唯一值进行关联是有问题---至少现阶段是这样
 */
let ITERATE_KEY = Symbol() 
let ITERATE_ARR= []
function handleSy() {
  ITERATE_ARR.push(ITERATE_KEY)
} 
handleSy()
handleSy()
console.log(ITERATE_ARR[0] ===  ITERATE_ARR[1] ) // true

console.log("----Object.setPrototypeOf----")
/**
 * Object.setPrototypeOf() 静态方法可以将一个指定对象的原型（即内部的 [[Prototype]] 属性）设置为另一个对象或者 null。
 * 由于现代 JavaScript 引擎优化属性访问所带来的特性的关系，更改对象的 [[Prototype]] 在各个浏览器和 JavaScript 引擎上都是一个很慢的操作
 * 推荐使用： Object.create()
 */
let apple = {}
let ban = {bar: 1}
console.log(apple?.bar)
Object.setPrototypeOf(apple, ban)
console.log(apple.bar)

console.log("---object.create---")
/**
 * Object.create()
 * Object.create() 静态方法以一个现有对象作为原型，创建一个新对象。
 */
let apple1 = Object.create(ban)
apple1.name = "apple"
console.log(apple1.name) // apple
console.log(apple1.bar) // 1
apple1.bar = 2
console.log(apple1.bar) // 2
console.log(ban.bar) // 1 
// 当没有的时候就向原型上拿，当设置的时候就自己也有了，再去拿就拿自己的，所以设置完之后，ban并没有被影响到