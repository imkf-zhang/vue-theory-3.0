let arr =  [1,2,3]

let dins

function timeout(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms, 'done');
  });
}
async function name3() {
  let res = await timeout(3000)
  console.log('延迟3秒函数执行')
  arr.push(4)
  if(arr.includes(4)) {
    clearInterval(dins);
  }
}

async function name2() {
  let res = await timeout(2000)
  console.log('延迟2秒函数执行')
  arr.push(5)
}

dins = setInterval(async()=> {
  console.log("定时器执行")
  await name3()
},1000)

// 定时器执行
// 定时器执行
// 定时器执行
// 延迟3秒函数执行
// 延迟3秒函数执行
// 延迟3秒函数执行

// 可以看到这个玩意儿并不是很好的策略

// 其实这种可以换种思路，用递归不就行了

async function name4() {
  console.log(this.name)
  let res = await timeout(3000)
  console.log('延迟3秒函数执行')
  arr.push(4)
  if(arr.includes(4)) {
    return
  }
  name4()
}

name4()