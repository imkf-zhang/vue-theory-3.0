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