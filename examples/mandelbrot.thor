fn mandelbrot(c, max_iters) {
    z = 0 + 0i
    iters = 0

    while len(z) <= 4 and iters < max_iters {
        z = z² + c
        iters++
    }

    return iters
}

print(mandelbrot(-0.25, 50))
print(mandelbrot(1, 50))