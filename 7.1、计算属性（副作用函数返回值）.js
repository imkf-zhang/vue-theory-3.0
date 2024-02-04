/**
 * 在7.1中其实可以知道，副作用函数可以做为函数返回值，return出去
 * 从而实现手动触发副作用函数------传入lazy属性为真即可
 * 
 * FIXME:
 * 能不能把响应式的数据抛出去呢？当然是能的
 *  */

let data = { foo: 1, bar: 5}
let activeEffect;
let bucket = new WeakMap() // 桶
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
    effectsTORUN.forEach(effectFn => 
      {
        if (effectFn.options.scheduler) {
          effectFn.options.scheduler(effectFn)
        }else {
          effectFn()
        }
      }
      )
     
    // effects && effects.forEach(element => {element()  });
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
// function effect(fn, option={}) {
//   console.log('----执行----')
//   const effectFn = () => {
//     console.log('----复函数执行----')
//     // 调用cleanup函数完成清除工作
//     cleanup(effectFn)
//     // 执行的时候将其设置为当前激活的副作用函数
//     activeEffect = effectFn
//     fn()
//   }
//   effectFn.options = option
//   // 用来存储所有与该副作用函数相关联的依赖集合
//   effectFn.deps = []
//   // 执行副作用函数
//   if(!option.lazy) {
//     effectFn()
//   }
//   return effectFn
// }

/**
 * 
 * @param {*} fn 郑州的副作用函数 
 * effectFn为包装后的副作用函数
 * @param {*} option 
 * @returns 
 */
function effect(fn, option={}) {
  console.log('----执行----')
  const effectFn = () => {
    console.log('----复函数执行----')
    // 调用cleanup函数完成清除工作
    cleanup(effectFn)
    // 执行的时候将其设置为当前激活的副作用函数
    activeEffect = effectFn
    // FIXME: 改动
    const res  =   fn()
    // FIXME: 改动
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
 * 把getter作为一个
 * @param {*} getter 
 */
function computed(getter) {
  const effectFn = effect(getter, {
    lazy: true
  })
  const obj = {
    // 当读取value时才执行effectFn
    get value() {
      return effectFn()
    }
  }
  return obj.value
}
const sum = computed(() => obj.foo + obj.bar)
console.log(sum)

  obj.foo = 15
  console.log(sum)
// obj.bar和obj.foo为响应式数据
// const effectFnOther = effect(() => obj.foo + obj.bar, {lazy: true})
// 此时,value就是上述响应式数据的之和
// let value = effectFnOther()
// console.log(value) // undefined