function fh(a) {
  return a
}
function fh1(b) {
  console.log(b)
}
fh1( b = fh('a') )

// 正确的，可以正常打印  函数参数也可以通过调取函数而来
