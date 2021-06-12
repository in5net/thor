import fs

path = "./code.thor"
print("path: {path}")
future = readfile(path)
print("future: {future}")
data = await future
print(data)