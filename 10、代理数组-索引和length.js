let activeEffect;
let stack = []
let bucket = new WeakMap() // 桶
let ITERATE_KEY = Symbol() //  for in 使用ownKeys来拦截，没办法和属性建立链接

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
  // FIXME: 针对数组的设置做一些处理，也应该将和length相关的副作用函数取出来执行
  if(type === 'ADD' && Array.isArray(obj)) {
    const lengthEffects = depsMap.get('length')
    lengthEffects && lengthEffects.forEach(effectFn => {
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

// 思考，既然是只读的，那就不应该 
// 1、被改变 （set） 2、被删除（delete）
// 那么追踪其变化也是没有意义的

/**
 * @description: 接受一个对象，按需返回一个响应式的数据；
 * 也可以理解为一个构造响应式的一个工厂函数，支持个性化定制的哦
 * @param {*} obj
 * @param {*} isShallow 是不是浅响应
 * @param {*} isReadonly 是不是只读   只读功能的实现
 * @return {*}
 */
function createReactive (obj, isShallow = false, isReadonly = false) {
  return new Proxy(obj,{
    get(target,key, receiver) {
       console.log('get 触发')
       // 代理对象可以通过某种方式访问原始对象（增加一个属性吧）
       if(key === 'raw') {
         return target
       }
      // 只有是非只读的时候才需要建立响应关系
       if(isReadonly) {
        track(target, key)
       }
       // 造成的影响就是使用代理对象obj访问bar属性时，那么receiver就是obj--可以简单理解为函数调用的this
       //  Reflect.get(target, key, receiver)代替之前的 target[key]，关键就是传入了第三个参数receiver---这个就是代理对象。所以访问器属性bar的getter函数内的this指向了代理对象obj
       const res = Reflect.get(target, key, receiver)
       //是不是一个浅响应
       if(isShallow) {
          return  res
       }
        
       if (typeof res === 'object' && res !== null) {
         // 递归，调用reactive包装成响应式数据---也就是都收集一下依赖
        //   深度只读实现的关键点，如果数据是只读，继续调用readOnly对值进行包装
         return isReadonly ? readOnly(res) : reactive(res)
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
      //  针对只读进行处理 
      if(isReadonly) {
        console.warn(`属性${key}是只读的`)
        return true
      }
      //  当设置的值和老值完全不一样的时候再触发设置
      let oldVal = target[key];
      console.log('set 触发')
      //  判断是设置值操作，还是添加值操作
      // FIXME: 代理的是数组时，如果设置的索引值小于数组长度，那自然就是设置。否则就视为添加
      const type = Array.isArray(target) ? (Number(key) < target.length  ? 'SET' : 'ADD' ) :  (Object.prototype.hasOwnProperty.call(target , key) ? "SET" : "ADD")
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
       //  针对只读进行处理 
       if(isReadonly) {
        console.warn(`属性${key}是只读的`)
        return true
      }
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
 * @description: 深响应
 * @param {*} obj
 * @return {*}
 */
function reactive(obj) {
  return createReactive(obj)
}
/**
 * @description: 浅响应
 * @param {*} obj
 * @return {*}
 */
function shallowReactive(obj) {
  return createReactive(obj, true)
}

/**
 * @description: 深只读函数
 * @param {*} obj
 * @return {*}
 */
function readOnly (obj) { 
  return createReactive(obj, false , true)
 }
/**
 * @description: 浅只读
 * @param {*} obj
 * @return {*}
 */
function shallowRead (obj) {
  return createReactive(obj, true, true)
}

// FIXME:   设置的索引值大于当前的数组的length时，会隐式的修改length的属性值，因此也要触发和length
// 相关的副作用函数的执行

//FIXME:   作为使用者，我不期望对象用一个函数让它变成响应式，而数组又是另一个，作为使用者我就关注
// 我把值传给你，你给我变成响应式-----这无疑增加了一个函数的的复杂程度