async function name1(params) {
  console.log(params)
}
let result = name1('lion')
console.log(result) // Promise { undefined }
result.then(res => console.log(res))


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
async function nameTime() {
  await name2()
  await name3()
}
nameTime()