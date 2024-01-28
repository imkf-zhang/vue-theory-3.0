// 分支导致两个问题: 1、桶里的内容变多  2、引发不必要的更新
// 解决：副作用函数执行时，把副作用函数有关的依赖（set中存的便是依赖）都给删除

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
    */
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
    /**
     * 老演员了
     */
    let obj = new Proxy({},{
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

     obj.ok = true
     obj.text = 'hello'

     let flag; // 数据标记
     effect(function effectFn() {
      console.log('副作用函数执行')
       flag = obj.ok ? obj.text : 'z'
     })

    obj.ok = false
   // obj.ok = false 其实执行的时候就已经给依赖集合给删除掉了
    obj.ok = true

setTimeout(() => {
  console.log('setTimeout函数执行')
  obj.text = '55'
}, 3000)


// 这个机制把：flag = obj.ok ? obj.text : 'z' 这个场景给完美解决掉了。

// 但是其实可以想一下，后续继续往这个obj上面添加对象可咋整--也能是响应式的？未必吧，得充走一遍完整流程吧----后面看看vue如何解决