function ergodicReadObjKeys(params, set = new Set()) {
  if(Object.prototype.toString.call(params) !== '[object Object]' || set.has(params)) return
  set.add(params)
  for (const key in params) {
    console.log(key)
    ergodicReadObjKeys(params[key],set)
  }
}

let obj = {
  a: {
    b: {
      c: 'c'
    }
  },
  1: {
    2: {
      3: {
        4: '4'
      }
    }
  }
}
ergodicReadObjKeys(obj)