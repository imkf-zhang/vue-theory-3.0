let data = { 
  foo: 1, 
  get bar() {
    return this.foo
  }
};
let activeEffect;
let stack = []
let bucket = new WeakMap() // 桶
let ITERATE_KEY = Symbol() // FIXME: for in 使用ownKeys来拦截，没办法和属性建立链接

let obj = new Proxy(data,{
  get(target,key, receiver) {
    console.log('get 触发')
     track(target, key)
      // 造成的影响就是使用代理对象obj访问bar属性时，那么receiver就是obj--可以简单理解为函数调用的this
      //  Reflect.get(target, key, receiver)代替之前的 target[key]，关键就是传入了第三个参数receiver---这个就是代理对象。所以访问器属性bar的getter函数内的this指向了代理对象obj
     return Reflect.get(target, key, receiver)
  },
  //捕捉对in的操作
  has(target,key) {
    console.log('get 触发')
     track(target, key)
     return Reflect.get(target, key)
  },
  // FIXME: 拦截for in 操作  只要for in 触发这里就会知道
  ownKeys(target) {
    // 将副作用函数与ITERATE_KEY关联
    track(target, ITERATE_KEY)
    return Reflect.ownKeys(target)
  },
  set(target,key,newVal,receiver) {
    console.log('set 触发')
    const res =  Reflect.set(target,key,newVal,receiver)
    target[key] = newVal;
    trigger(target, key)
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
  // 取得与key相关联的副作用函数
  const effects = depsMap.get(key)
  //FIXME: 取得与ITERATE_KEY相关联的副作用函数
  const iterateEffects = depsMap.get(ITERATE_KEY)
   // 解决死循环问题
   const effectsTORUN = new Set()
//FIXME: 将与key相关联的副作用函数添加到effectsTORUN
   effects && effects.forEach(effectFn => {
     if(effectFn !== activeEffect) {
         effectsTORUN.add(effectFn)
        }
       
   })
  //  FIXME: 将与ITERATE_KEY相关联的副作用函数也添加到effectsTORUN
  iterateEffects && iterateEffects.forEach(effectFn => {
    if(effectFn !== activeEffect) {
        effectsTORUN.add(effectFn)
       }
      
  })
  // 执行函数
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

// FIXME: for in 的本质，使用Reflect.ownKeys(obj) 来获取只属于对象自身键，
effect(() => {
  for (const key in obj) {
    console.log(key)
  }
})



// 1、什么时候会擦护发for in 的执行，举个场景：为对象增加新的属性是期望for in执行一把的
obj.zkf = 'zkf'

// 2、修改属性也期望