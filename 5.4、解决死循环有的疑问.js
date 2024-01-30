
let activeEffect
let res = []
function effect() {
  const effectFn = () => {
    activeEffect = effectFn
    res.push(activeEffect)
  }
  // 执行副作用函数
  effectFn()
}
effect()
effect()
console.log(res[0] === res[1])
//  false

// 验证了解决死循环问题的可行性