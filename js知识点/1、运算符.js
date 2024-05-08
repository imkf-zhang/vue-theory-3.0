console.log( null ?? 6) // 6
console.log( undefined ?? 6) // 6

console.log( '' ?? 6) // ''
console.log( false ?? 6) //false
console.log( NaN ?? 6) // NaN
console.log( 0 ?? 6) // 0


console.log('---------')
var x = null
var x1 = undefined
var x2 = ""
var x3 = NaN
var y = 5

console.log(x ??= y) // 5
console.log(x = (x ?? y)) // 5

console.log(x1 ??= y) // 5
console.log(x1 = (x ?? y)) // 5

console.log(x2 ??= y) // ''
console.log(x2 = (x2 ?? y)) // ''

console.log(x3 ??= y) // NaN
console.log(x3 ??= y) // NaN

console.log(x3 = (x3 ?? y)) // NaN
console.log(b = (3+1)) // 4
