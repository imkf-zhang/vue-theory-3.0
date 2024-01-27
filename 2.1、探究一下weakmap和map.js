    // weakMap的key只能是对象（null除外）和symbol类型;  weakMap是弱引用
// 这样分析一下：立即函数执行完因为foo还作为key饮用者，所以不会被垃圾回收机制回收掉。但是weakMap是弱引用，不会影响到垃圾回收器的工作，函数执行完，垃圾回收期会立马把bar从内存中移除

let map = new Map();
let weakmap = new WeakMap();
(function () {
  const foo = {name: 'kate'};
  const bar = {sex: 'man'};
  map.set(foo,1);
  weakmap.set(bar,2);
})();

console.log(map.keys())  // [Map Iterator] { { name: 'kate' } }
// console.log(weakmap.keys())
