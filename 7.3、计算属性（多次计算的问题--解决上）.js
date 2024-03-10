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
/**
 * 为了解决多次计算的问题，需要增加缓存功能，只有当值脏了的时候再去重新计算
 * @param {*} getter 
 */
function computed(getter) {
  let value // 上次的值
  let dirty = true // 脏了
  const effectFn = effect(getter, {
    lazy: true
  })
  const obj = {
    // 当读取value时才执行effectFn
    get value() {
      if(dirty) {
        dirty = false
        value = effectFn()
      }
      return value;
    }
  }
  return obj
}
const sum = computed(() => obj.foo + obj.bar)
console.log(sum.value)
console.log(sum.value)
obj.foo = 9

