/*
 * @Author: zhangkaifan 15638452918@163.com
 * @Date: 2024-04-27 08:27:40
 * @LastEditors: zhangkaifan 15638452918@163.com
 * @LastEditTime: 2024-04-27 13:14:14
 * @FilePath: \vue-theory-3.0\9.4.1、【知识点补充】了解一下ownKeys的特性（补充一些Object的牛逼方法）.js
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
