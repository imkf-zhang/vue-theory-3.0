function timeout(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms, 'done');
  });
}


function startPolling() {
  setInterval(async() => {
   let res=  await timeout(1);
   console.log("轮询1秒", res)
  }, 1000);
}

async function name2() {
  await timeout(3000)
  console.log('done: 3000')
  startPolling()
}

name2()