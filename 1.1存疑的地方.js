let arr = []
let val

setTimeout(() => {
  val = 1
  arr.push(val)
}, 1000);
setTimeout(() => {
  val = 2
  arr.push(val)
}, 2000);

setTimeout(() => {
  console.log(arr)
  console.log(val)
}, 3000);

//[ 1, 2 ]
// 2
