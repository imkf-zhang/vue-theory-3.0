// FIXME: 期望当foo改动的时候肯定和bar关联上

let data = { 
  foo: 1, 
  get bar() {
    return this.foo
  }
};
let activeEffect;
let stack = []
let bucket = new WeakMap() // 桶


let obj = new Proxy(data,{
  get(target,key) {
    console.log("目标对象", target)
    console.log('get 触发')
     track(target, key)
     return target[key]
  },
  set(target,key, newVal) {
    console.log('set 触发')
    target[key] = newVal;
    trigger(target,key)
  }
})

function track(obj, key = 'value') {
  if(!activeEffect) return
  let desMap = bucket.get(obj)
  if(!desMap) {
   bucket.set(obj,(desMap = new Map()))
  }
  let desSet = desMap.get(key)
  if(!desSet) {
   desMap.set(key,(desSet = new Set()))
  }
  desSet.add(activeEffect)
  console.log('desSet', desSet)
  // 添加进去，为后期删除做准备  
  activeEffect.deps.push(desSet)
}

function trigger(obj, key = 'value') {
  let depsMap = bucket.get(obj)
  if(!depsMap) return
  const effects = depsMap.get(key)

   // 解决死循环问题
   const effectsTORUN = new Set()

   effects && effects.forEach(effectFn => {
     if(effectFn !== activeEffect) {
         effectsTORUN.add(effectFn)
        }
       
   })
   effectsTORUN.forEach(effectFn => {
    if(effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    }else {
      effectFn()
    }
   })
}
/**
 * 把和副作用函数相关的依赖给删掉
 * @param {*} effectFn 
 */
function cleanup (effectFn) { 
  for (let index = 0; index < effectFn.deps.length; index++) {
    // 依赖集合
    const element = effectFn.deps[index];
    // 将副作用函数从依赖集合中删除
    element.delete(effectFn)
  }
  effectFn.deps.length = 0
 }
/**
 * 
 * @param {*} fn 真正的副作用函数 
 * effectFn为包装后的副作用函数
 * @param {*} option 
 * @returns 
 */
function effect(fn, option={}) {
  const effectFn = () => {
    // 调用cleanup函数完成清除工作
    cleanup(effectFn)
    // 执行的时候将其设置为当前激活的副作用函数
    activeEffect = effectFn
    stack.push(activeEffect)
    let res = fn()
    stack.pop()
    activeEffect = stack[stack.length -1]
    return res
  }
  effectFn.options = option
  // 用来存储所有与该副作用函数相关联的依赖集合
  effectFn.deps = []
  // 执行副作用函数
  if(!option.lazy) {
    effectFn()
  }
  return effectFn
}



effect(() => {
  console.log(obj.bar)
})
// FIXME:  期望当foo变动的时候可以打印obj.bar
// obj.foo++

// 由于get拦截函数内，通过target[key] 返回属性值。
// target是原始对象data，key就是字符串bar，target[key]相当于是data.bar
// 使用obj.bar访问bar属性时，他的getter函数内的this其实指向的就是原始对象data

//最终其实就是:
// effect(() => {
//   console.log(data.bar)
// })

// TODO: 副作用函数内通过原始对象，访问他的某个属性是不会建立响应关系的

// 这里有一个原始对象  和代理对象的概念------=这两个要精确的区分开来