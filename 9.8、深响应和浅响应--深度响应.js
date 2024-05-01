let activeEffect;
let stack = []
let bucket = new WeakMap() // 桶
let ITERATE_KEY = Symbol() //  for in 使用ownKeys来拦截，没办法和属性建立链接

/**
 * @description: 接受一个对象，返回一个响应式的数据
 * @param {*} obj
 * @return {*}
 */
function reactive (obj) {
   return new Proxy(obj,{
     get(target,key, receiver) {
       console.log('get 触发')
      // 代理对象可以通过某种方式访问原始对象（增加一个属性吧）
      if(key === 'raw') {
        return target
      }
        track(target, key)
         // 造成的影响就是使用代理对象obj访问bar属性时，那么receiver就是obj--可以简单理解为函数调用的this
         //  Reflect.get(target, key, receiver)代替之前的 target[key]，关键就是传入了第三个参数receiver---这个就是代理对象。所以访问器属性bar的getter函数内的this指向了代理对象obj
        // return Reflect.get(target, key, receiver)
        //FIXME: 进行改造 
        const res = Reflect.get(target, key, receiver)
        if (typeof res === 'object' && res !== null) {
          // 递归，调用reactive包装成响应式数据---也就是都收集一下依赖
          return reactive(res)
        }
        return res
     },
     //捕捉对in的操作
     has(target,key) {
       console.log('get 触发')
        track(target, key)
        return Reflect.get(target, key)
     },
     //  拦截for in 操作  只要for in 触发这里就会知道
     ownKeys(target) {
       // 将副作用函数与ITERATE_KEY关联
       track(target, ITERATE_KEY)
       return Reflect.ownKeys(target)
     },
     // 拦截设置属性操作
     set(target,key,newVal,receiver) {
       //  当设置的值和老值完全不一样的时候再触发设置
       let oldVal = target[key];
       console.log('set 触发')
       //  判断是设置值操作，还是添加值操作
       const type = Object.prototype.hasOwnProperty.call(target , key) ? "SET" : "ADD"
       // hasOwnProperty 用于判断是对象的自身属性（而不是继承来的属性）中是否具有指定属性
   
       // 设置属性值
       const res =  Reflect.set(target,key,newVal,receiver)
      // target === receiver.raw 说明receiver就是target的代理对象
       if(target === receiver.raw) {
         //  判断设置的值和现在的值不一样的时候再进行trigger  对NaN场景进行兼容
         if( oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
          trigger(target, key, type)
         }
       }
      
       return res
     },
     //  拦截删除时候的操作
     deleteProperty(target, key) {
       // 检查被操作的属性是否是对象自己的属性
       const hasKey = Object.prototype.hasOwnProperty.call(target, key)
       // 使用 Reflect.deleteProperty 完成属性的删除  操作成功后返回Boolean值
       const res = Reflect.deleteProperty(target, key)
       if(res && hasKey) {
         trigger(target, key, 'DELETE')
       }
       return  res
     }
})
}
/**
 * @description: 收集依赖
 * @param {*} obj
 * @param {*} key
 * @return {*}
 */
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
/**
 * @description: 
 * @param {*} obj
 * @param {*} key 
 * @param {*} type 增加操作类型传参
 * @return {*}
 */
function trigger(obj, key = 'value', type) {
  let depsMap = bucket.get(obj)
  if(!depsMap) return
  // 取得与key相关联的副作用函数
  const effects = depsMap.get(key)
  
   // 解决死循环问题
   const effectsTORUN = new Set()
// 将与key相关联的副作用函数添加到effectsTORUN
   effects && effects.forEach(effectFn => {
     if(effectFn !== activeEffect) {
         effectsTORUN.add(effectFn)
        }
       
   })
  //  只有当操作被识别出来是添加的时候才进行该操作
   if(type === 'ADD' || type === 'DELETE') {
    // 取得与ITERATE_KEY相关联的副作用函数
    const iterateEffects = depsMap.get(ITERATE_KEY)
   //   将与ITERATE_KEY相关联的副作用函数也添加到effectsTORUN
   iterateEffects && iterateEffects.forEach(effectFn => {
     if(effectFn !== activeEffect) {
         effectsTORUN.add(effectFn)
        }
      })
   }
  
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

// FIXME: 实现深度响应式
const obj = reactive({foo: {bar: 1}})
effect(() => {
  console.log(obj.foo.bar)
})
obj.foo.bar = 2 // 这个不会触发响应
// FIXME: 进行解释：obj.foo返回的{bar： 1} 并不是一个响应式，所以自然不会进行响应式的一套逻辑
// 如果想让其进行响应，那自然是走一套这个逻辑不就行了

// obj.foo = {bar: 2} // 这个会触发响应