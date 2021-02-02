fn fib(n) {
  if n < 2: return n
  return fib(n - 1) + fib(n - 2)
}

print("Here we go...")
print(fib(10))