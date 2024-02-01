// 控制次数的场景：一个响应式数据变变变的，我们不关注中间状态只关注最终结果，此时是不是需要限制一下次数




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

// 任务队列
const jobQueue = new Set()
// 微任务队列 也仅仅是起微任务队列的作用
const P = Promise.resolve()
// 标志 刷新队列
let isFlushing = false

// FIXME: 可以知道当同步任务执行完才会开始执行微任务
function flushJob() {
  // 队列正在刷新就什么也不做
  if(isFlushing) return
  isFlushing = true
  P.then(() => {
    jobQueue.forEach(job => job())
  }).finally(()=> {
    isFlushing = false
  })
}


effect(()=> {
  console.log(obj.count)
},{
  scheduler(fn) {
    console.log("调度执行")
    // 每次调度时，副作用函数放进 队列中
    jobQueue.add(fn)
    console.log("---0--",jobQueue.size )
    flushJob()
  }
})
obj.count++
obj.count++
obj.count++
obj.count++


// 1
// 调度执行
// ---0-- 1
// 调度执行
// ---0-- 1
// 调度执行
// ---0-- 1
// 调度执行
// ---0-- 1
// 5