let data =  {foo: true, bar: true} 
let activeEffect;
let bucket = new WeakMap() // 桶

function cleanup (effectFn) { 
  for (let index = 0; index < effectFn.deps.length; index++) {
    // 依赖集合
    const element = effectFn.deps[index];
    // 将副作用函数从依赖集合中删除
    element.delete(effectFn)
  }
  effectFn.deps.length = 0
 }
 function effect(fn) {
  const effectFn = () => {
    // 调用cleanup函数完成清除工作
    cleanup(effectFn)
    // 执行的时候将其设置为当前激活的副作用函数
    activeEffect = effectFn
    fn()
  }
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
        effectsTORUN.forEach(effectFn => effectFn())
        // effects && effects.forEach(element => {element()  });
      }
    })

let temp1,temp2

effect(function effectFn1() {
  console.log('effectFn1执行了')
  effect(function effectFn2() {
    console.log('effectFn2执行了')
    temp2 = obj.bar
  })
  temp1 = obj.foo
})
obj.foo = 'false'