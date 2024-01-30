// 思考一个问题：现在我们的响应式是可控的么？显然不是
// 一个数据交给了响应式后，我们似乎已经无能为力了

// 作为框架的设计者，我们当然是想让一切都在自己的掌控内

// 所以 要控制响应式的调度执行
// 1、如何执行  2、执行时机  3、执行次数

// TODO: 想
// 如果这个调度还是可以用户自定义传的，那可就太好了
// 1、用户自定义传----最好的方式不就是函数传参
// 2、响应式的get，set拦截不就是和avtiveEffect勾连在一起---大概率也是往他身上挂
// 3.既然是要控制响应式的执行，那肯定不会是get阶段，只能是set阶段，来干扰副作用函数的执行



let data = { count: 1}
let activeEffect;
let bucket = new WeakMap() // 桶

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
 * activeEffect 是作为函数存在依赖集合中的，所以必须是函数
 * effectFn.deps属性，该属性是个数组，用来存储所有包含当前副作用函数的依赖集合
 * option 是调度函数
*/
function effect(fn, option={}) {
  const effectFn = () => {
    // 调用cleanup函数完成清除工作
    cleanup(effectFn)
    // 执行的时候将其设置为当前激活的副作用函数
    activeEffect = effectFn
    fn()
  }
  // FIXME:调度函数挂上去
  effectFn.options = option
  // 用来存储所有与该副作用函数相关联的依赖集合
  effectFn.deps = []
  // 执行副作用函数
  effectFn()
}
/**
 * 老演员了
 */
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
        // FIXME:有调度执行就走调度执行，没有就不走
        // 又回去了
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

effect(()=> {
  console.log(obj.count)
},{
  scheduler(fn) {
setTimeout(fn)
  }
})

obj.count++ 

console.log('over')