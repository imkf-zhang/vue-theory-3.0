let activeEffect

function effect(fn) {
  const effectFn= () => {
    console.log('effectFn执行')
    activeEffect = effectFn
    console.log( activeEffect  === effectFn)
    fn()
  }
  effectFn.desps = []
  effectFn()
}

effect(() => {console.log(111)}) 
// effectFn执行
// true
// 111
console.log('---------------')
console.log('activeEffect',activeEffect) 
// activeEffect [Function: effectFn] { desps: [] }

console.log('---------------')
activeEffect()
// effectFn执行
// true
// 111
