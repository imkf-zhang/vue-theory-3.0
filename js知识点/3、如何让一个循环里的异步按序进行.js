function timeout(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms, 'done');
  });
}
async function name2() {
  let res = await timeout(3000)
  console.log('done: 3000')
}
async function name3() {
  let res = await timeout(2000)
  console.log('done: 2000')
}

let arr = [name2, name3]

// arr.forEach(async item => {
//   await item()
// })


async function para() {
  for (let index = 0; index < arr.length; index++) {
    const element = arr[index];
    await element()
  }
}

para()