# 便于阅读
1、TOODO  FIXME 为当前节点的重要内容，并不是提示未完成

# 自己的领悟

## effect函数的职能
1、外界传一个什么函数都可以进行追踪，并且还要执行它
i: 追踪最好的方式-->作为函数的参数传进来，执行一下
2、为响应式服务，为了解决响应式的各个场景，衍生出了这么奇怪的结构： activeEffect = effectFn
```javascript
 function effect(fn) {
  const efefctFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    stack.push(activeEffect)
    fn() 
    stack.pop()
    activeEffect = stack[stack.length -1]
  }
  effectFn.deps = []
  effectFn()
}
```