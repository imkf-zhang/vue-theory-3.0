// 可迭代对象离不开  for of   for of 就是专门为了循环可迭代对象

// 概念型的东西：
// 1、es2015定义了迭代协议，它不是一种语法而是一种协议
// 2、一个对象是否可迭代，取决于该对象或者该对象的原型上是否实现了@@iterator方法  => 这里的@@[name]标志，在ecmascript规范里用来代指
// javascript内建的symbols值。demo： @@iterator指的就是Symbol.iterator这个值，如果一个对象实现了Symbol.iterator方法，那么这个对象就是可迭代的



// 数组就是一个可迭代对象


try {
  let obj = { name: 'f', age: 18}
  for (const iterator of obj) {
    console.log(iterator)
  }
}catch (err) {
  console.error(err)
}

// 可以断点一下基本就知道怎么回事了，当打印0的时候, 'value: iteratorObj.value++,'中iteratorObj.value已经是1了
// 1、先空转一圈读一下 2、正式开始"循环"读，进到next里，++为1，false。打印原始值0  3、接着往下循环，++为2，false，打印原始值2  4、接着往下循环，++为3，true，不打印了
const iteratorObj = {
  value: 0,
  [Symbol.iterator]() {
    return {
      next() {
        return {
          value: iteratorObj.value++,
          done: iteratorObj.value > 2 ? true: false
        }
      }
    }
  }
}

for (const iterator of iteratorObj) {
  console.log(iterator)
}



let arr = [1,2,3,4,5]

const item = arr[Symbol.iterator]()
console.log(item.next()) // { value: 1, done: false }
console.log(item.next()) // { value: 2, done: false }
console.log(item.next()) // { value: 3, done: false }
console.log(item.next()) // { value: 4, done: false }
console.log(item.next()) // { value: 5, done: false }
console.log(item.next()) // { value: undefined, done: true }

console.log('0------0')



const kate = {
  name: "ke",
  say() {
    console.log(this);
    return "kate";
  }
}

let  ke = kate.say()  // { name: 'ke', say: [Function: say] }


// 实现一下数组的迭代器
const array1  = [1,2,3]
array1[Symbol.iterator] = function() {
  const target = this;
  const len = target.length
  let index = 0
  return {
    next() {
      return {
        value: index < len ? target[index] : undefined,
        done: index++ >= len
      }
    }
  }
}
const I = array1[Symbol.iterator]()
console.log(I.next())//{ value: 1, done: false }
console.log(I.next())//{ value: 2, done: false }
console.log(I.next())//{ value: 3, done: false }
console.log(I.next())//{ value: undefined, done: true }
