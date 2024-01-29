// 这个思路妙呀：利用栈压入，弹出，重新赋值
let data =  {foo: true, bar: true}
let temp1,temp2
// FIXME:
let stack = []
let activeEffect;
let bucket = new WeakMap() // 桶

function cleanup (effectFn) { 
  for (let index = 0; index < effectFn.deps.length; index++) {
    // 依赖集合
    const element = effectFn.deps[index];
    // 将副作用函数从依赖集合中删除
    element.delete(effectFn)
  }
  effectFn.deps.length = 0
 }
 function effect(fn) {
  const effectFn = () => {
    // 调用cleanup函数完成清除工作
    cleanup(effectFn)
    // 执行的时候将其设置为当前激活的副作用函数
    activeEffect = effectFn
    // FIXME: 压入栈中
    stack.push(activeEffect)
    fn() // TODO:重点是这一步, 这一步触发了内层的执行
    //FIXME: 弹出栈
    stack.pop()
    //FIXME: 赋值
    activeEffect = stack[stack.length -1]
  }
  // 用来存储所有与该副作用函数相关联的依赖集合
  effectFn.deps = []
  // 执行副作用函数
  effectFn()
  
}
let obj = new Proxy(data,{
      get(target,key) {
       if(!activeEffect) return
       let desMap = bucket.get(target)
       if(!desMap) {
        bucket.set(target,(desMap = new Map()))
       }
       let desSet = desMap.get(key)
       if(!desSet) {
        desMap.set(key,(desSet = new Set()))
       }
       desSet.add(activeEffect)
       // 添加进去，为后期删除做准备  
       activeEffect.deps.push(desSet)
       return target[key]
      },
      set(target,key, newVal) {
        target[key] = newVal;
        let first = bucket.get(target)
        if(!first) return
        const effects = first.get(key)
        // 解决死循环问题
        const effectsTORUN = new Set(effects)
        effectsTORUN.forEach(effectFn => effectFn())
        // effects && effects.forEach(element => {element()  });
      }
    })


// 模拟场景1: 这个场景不会有任何的问题
// effect(function effectFn1() {
//   temp1 = obj.foo
//   console.log('effectFn1执行了')
//   effect(function effectFn2() {
//     console.log('effectFn2执行了')
//     temp2 = obj.bar
//   })
  
// })

// obj.foo = 'false' 
// effectFn1执行了
// effectFn2执行了
// effectFn1执行了
// effectFn2执行了


// 模拟场景2
effect(function effectFn1() {
  console.log('effectFn1执行了')
  effect(function effectFn2() {
    console.log('effectFn2执行了')
    temp2 = obj.bar
  })
  temp1 = obj.foo
})

obj.foo = 'false' 
// effectFn1执行了
// effectFn2执行了
// effectFn2执行了

// 场景2，的根因是activeEffect被effectFn2给覆盖了

解决