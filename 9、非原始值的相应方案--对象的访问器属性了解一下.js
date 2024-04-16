// 对象的访问器属性

let obj =  {
  foo: 1,
  get bar() {
    return this.foo
  }
}

console.log(obj.bar)  // 会打印1