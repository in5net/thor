fn chudnovsky(iters) {
    sum = 0
    for q in iters {
        num = (6q)! * (545140134q + 13591409)
        den = (3q)! * (q!)³ * (-262537412640768000) ^ q
        sum += num / den
    }
    return 426880 √10005 / sum
}

print("π = {chudnovsky(2)}")