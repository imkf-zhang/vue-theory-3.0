<!--
 * @Author: zhangkaifan 15638452918@163.com
 * @Date: 2024-02-06 19:34:01
 * @LastEditors: zhangkaifan 15638452918@163.com
 * @LastEditTime: 2024-05-03 22:38:03
 * @FilePath: \vue-theory-3.0\readme.md
 * @Description: 
 * 
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved. 
-->
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
## 解决特殊场景的问题，且又对正常场景不影响，是多么的好------>话说，我可以区分这些场景从而让代码执行或不执行，这样会不会给vue提交一些代码

## 定个小目标，2024年可以给vue提交一些代码被认可

----

> 从9.2开始记录一些思考

### 1、原始对象和代理对象
既然是响应式，那就要研究的深一些，**用户日常使用的js方法**都可以变成响应式的

```java
// 访问器属性属于是一种正常使用，但是可能会让this指向原始对象而非代理对象
let obj =  {
  foo: 1,
  get bar() {
    return this.foo
  }
}
console.log(obj.bar)  // 会打印1
```
解决上述问题，就引入了Reflect

get方法的第三个参数: **它总是指向原始的读操作所在的那个对象，一般情况下就是 Proxy 实例**
```java
const proxy = new Proxy({}, {
  get: function(target, key, receiver) {
    return receiver;
  }
});
proxy.getReceiver === proxy // true
```
```java
let obj = new Proxy(data,{
  
  get(target,key, receiver) {
    
     return Reflect.get(target, key, receiver)
  }
})
```
## 2、常规对象和异质对象
如何区分一个对象是普通对象还是函数对象？
>首先要了解内部方法和内部槽，函数对象会部署内部方法[[Call]]，普通对象不会

对象的实际语义是由对象的**内部方法**指定的,何为内部方法？
>对一个对象进行操作是在引擎内部调用的方法--这些对于javascript使用者是不可见的
>内部方法具有多态性--相同的内部方法不同的表现，普通对象部署的[[Get]] 和Proxy对象部署的[[Get]]就是不一样的

## 3、对象的读取其实是比较宽泛的概念
1、obj.foo是读取
2、使用for in 去发现有没有对应的key也是读取
3、使用key in obj也是读取

## 4、创建代理对象时没有指定对应的拦截函数，例如：没有get() 拦截函数，当通过代理对象访问属性值时
代理对象的内部方法[[get]]会调用原始对象的内部方法[[Get]]来获取属性值--这就是**代理透明性质**

### 6、一些js的知识
1、hasOwnProperty 用于判断是对象的自身属性（而不是继承来的属性）中是否具有指定属性
```javascript
Object.prototype.hasOwnProperty.call(target , key)  // 返回值true或false
```
2、如何判断在一个条件里排除NAN的情况
```javascript
  if( oldVal !== newVal) {
     console.log('say hi')
    }
// NaN !== NaN  为真值，此时就有问题了

// 所以应该
  if( oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
     console.log('say hi')
    }
```
3、立马执行函数前面写个;避免因为打包导致的一些问题
```javascript
;(()=> {console.log('say hi')})()
```
4、一个很重要的知识点： 函数嵌套函数，参数是可以隔代空传的，没必要代代都带着
```javascript
function createReactive (obj, isShallow = false, isReadonly = false) {
  set() {
    if(isReadOnly) {
      // 一些逻辑处理
    }
  }
}
```
### 7、对象的深响应浅响应，深只读浅只读
都是针对get阶段进行深度即可，而深度用的又都是递归

## 8、数组

### 数组的特殊性
```javascript
let arr = []
arr[4] = '4'
console.log(arr[0]) // undefined
console.log(arr, arr.length) 
// [ <4 empty items>, '4' ]    5
```

......

##### 过程中写一些日记：

###### 2024.4.27

时常感觉尤工的js之深厚，人家是吧js的内在联系都了解，贯通后，有了框架的输出；
而我却是在人家的框架的基础上才去了解了这些知识---时常自愧不如

###### 20240.5.3
作为使用者，我不期望对象用一个函数让它变成响应式，而数组又是另一个，作为使用者我就关注
我把值传给你，你给我变成响应式-----这无疑增加了一个函数的的复杂程度