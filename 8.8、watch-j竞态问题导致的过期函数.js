// watch的本质： 观测一个响应式数据，数据变化是通知并执行回调函数

// 其实还是不太懂为啥那样处理，就可以吧过期的副作用给清楚掉

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

  // 将scheduler调度函数抽出来为一个单独的函数
  let job = () => {
    // scheduler拿到的是新值
    newVal = effectFn()
    // 当数据变化时，调用回调函数cb
    cb(newVal,oldVal)
    oldVal = newVal
  }

  // 作案手法堪称高明，这里还有写个函数---要学习这种写法
  const effectFn =  effect(
    () => getter(),
    {
      lazy: true,
      // FIXME: 这里开始改动
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
  
  if(options.immediate) {
    job()
  }else {
     // 新值更新旧值
      oldVal = effectFn()
  }
 
 }



 watch(obj, async(newVal, oldVal, oninvalid) => {
  
 })
