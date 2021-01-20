fn intercepts(a, b, c) {
    p = √(b² - 4a * c)
    print(p)
    x = (-b ± p) / (2a)
    return x
}

print(intercepts(1, 0, -1))