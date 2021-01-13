c = -0.25 + 0i
z = 0 + 0i

iters = 0
while len(z) < 4 and iters < 100 {
    z = z^2 + c
    iters = iters + 1
}

print(iters)