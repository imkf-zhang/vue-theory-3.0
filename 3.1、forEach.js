let  bar = ['a', 'b','c']

bar.forEach(item => {
  console.log(item)
  bar.splice(0,1)
})

let set = new Set(['red', 'green', 'blue']);
set.forEach(item => {
  console.log(item)
  set.delete('green')
})
// 最终打印  red  blue   所以：foreach中操作当前循环的数据并不能那个让循环重新执行

console.log('是否会死循环')

// 这种情况确实是会死循环的
// let setOther  =  new Set([1])
// setOther.forEach(item => {
//   setOther.delete(1)
//   setOther.add(1)
//   console.log('foreach ing')
// })

// 避免死循环的办法
let setOther1  =  new Set([1])
let setOther2  =  new Set(setOther1)
console.log(setOther2) // Set(1) { 1 }
console.log(setOther2 === setOther1) // false
setOther2.forEach(item => {
  setOther1.delete(1)
  setOther1.add(1)
  console.log('foreach ing')
})
console.log(setOther1) // Set(1) { 1 }