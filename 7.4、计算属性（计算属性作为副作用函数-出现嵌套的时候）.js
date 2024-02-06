let data = { foo: 1, bar: 5}
let activeEffect;
let bucket = new WeakMap() // 桶
let obj = new Proxy(data,{
  get(target,key) {
    console.log('get 触发')
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
    effectsTORUN.forEach(effectFn => 
      {
        if (effectFn.options.scheduler) {
          effectFn.options.scheduler(effectFn)
        }else {
          effectFn()
        }
      }
      )
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
  return obj[key]
}

function trigger(obj, key = 'value') {
  obj[key] = newVal;
  let first = bucket.get(obj)
  if(!first) return
  const effects = first.get(key)
  // 解决死循环问题
  const effectsTORUN = new Set(effects)
  effectsTORUN.forEach(effectFn => 
    {
      if (effectFn.options.scheduler) {
        effectFn.options.scheduler(effectFn)
      }else {
        effectFn()
      }
    }
    )
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
    const res  =   fn()
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
// /**
//  * 把getter作为一个
//  * @param {*} getter 
//  */
// function computed(getter) {
//   const effectFn = effect(getter, {
//     lazy: true
//   })
//   const obj = {
//     // 当读取value时才执行effectFn
//     get value() {
//       return effectFn()
//     }
//   }
//   return obj
// }
function computed(getter) {

  let value;
  let dirty = true 
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() { 
      // TODO: 改造
     if(!dirty) {
      dirty = true
      trigger(obj, 'value')
     }
    }
  })
  const obj = {
    // 当读取value时才执行effectFn
    get value() {
      if(dirty) {
        value = effectFn()
        dirty= false
      }
      track(obj, 'value')
      return value
    }
  }
  return obj
}


const sum = computed(() => obj.bar + obj.foo)
effect(() => {
  console.log(sum.value)
})

// 计算属性内部有effect，并且是懒执行，只有当真正读取计算属性的值时才会执行
// 外层在effect并不会被内层的收集
