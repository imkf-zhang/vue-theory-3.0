// watch的本质： 观测一个响应式数据，数据变化是通知并执行回调函数

let data = { foo: 1, bar: 5}
let activeEffect;
let stack = []
let bucket = new WeakMap() // 桶


let obj = new Proxy(data,{
  get(target,key) {
    console.log('get 触发')
     track(target, key)
     return target[key]
  },
  set(target,key, newVal) {
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
  console.log('----执行----')
  const effectFn = () => {
    console.log('----副函数执行----')
    // 调用cleanup函数完成清除工作
    cleanup(effectFn)
    // 执行的时候将其设置为当前激活的副作用函数
    activeEffect = effectFn
    stack.push(activeEffect)
    let res = fn()
    // 执行完之后，弹出栈
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

/**
 * 用上遍历
 * @param {*} params 
 * @param {*} set 
 * @returns 
 */
function ergodicReadObjKeys(params, set = new Set()) {
  if(Object.prototype.toString.call(params) !== '[object Object]' || set.has(params) || params === null) return
  set.add(params)
  for (const key in params) {
    console.log(key)
    ergodicReadObjKeys(params[key],set)
  }
}

/**
 *watch 可以接收一个对象，也可以接收一个getter函数 
 * 实现watch依赖那些属性变化时进行响应处理
 * @param {*} source 
 * @param {*} cb 
 * @param {*} options
 */
function watch(source, cb, options ={}) { 
  // 做出兼容
  let getter;
  // 如果是函数，直接传递就好，因为effect接收的就是函数，effect---->为了收集依赖
  if( typeof source === 'function') {
      getter = source
  } else {
      getter = () => ergodicReadObjKeys(source)
  }
  //定义新值，老值
  let newVal,oldVal

  // FIXME: 改动的地方
  // cleanup 用来存储用户注册的过期回调
  let cleanup
  // 定义onInvalidate函数
  function onInvalidate(fn) {
    // 将过期回调存储到cleanup中----【给个啥都不舍得直接用掉，而是选择存一份--哈哈】
    cleanup = fn
  }
  // 将scheduler调度函数抽出来为一个单独的函数
  let job = () => {
    // scheduler拿到的是新值
    newVal = effectFn()
    // FIXME: 改动的地方
    if(cleanup) {
      cleanup()
    }

    // 当数据变化时，调用回调函数cb
    cb(newVal,oldVal,onInvalidate)
    oldVal = newVal
  }

  // 作案手法堪称高明，这里还有写个函数---要学习这种写法
  const effectFn =  effect(
    () => getter(),
    {
      lazy: true,
      scheduler: () => {
        // 在调度函数中判断flush 是否为'post'，如果是就放到微任务队列中执行
        if(options.flush === 'post') {
          const p = Promise.resolve()
          p.then(job)
        }else {
          job()
        }
      }
    }
  )
  // 是否立即进行出发副作用函数
  if(options.immediate) {
    job()
  }else {
     // 新值更新旧值
      oldVal = effectFn()
  }
 
 }



 watch(obj, async(newVal, oldVal, onInvalid) => {
  // FIXME: 
  // 定义一个标志，代表当前副作用函数是否过期，默认是false，没过期

  // TODO:1
  let expired =  false;
  // 注册一个过期回调---过期时调用函数，将expired设置为true
  // TODO:2
  onInvalid(()=> {
    expired = true
  })
  // 发送网络请求，竞态问题的场景
  const res = await fetch('/path/to/request')
  // 只有当该副作用函数执行没有过期时在进行后续的操作
  // TODO:3
  if(!expired) {
    finalData = res
  }
 })

 obj.foo++  // 1000ms响应

 setTimeout(() => {
   obj.foo++
 },200)

//  理解：
// 执行回调函数之前都会判断cleanup 是否存在，如果存在就会优先执行过期的回调
// 1、就一个坑位，第一个很慢，咣叽一下占住了，迟迟不结束，别的自然不能用
// 解释 : expired在1,2,3应用，是不是会造成 cleanup 无法销毁哦？