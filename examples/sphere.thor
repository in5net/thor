fn diameter(r) -> 2r
fn circumference(r) -> π * diameter(r)
fn surface_area(r) -> 4π * r²
fn volume(r) -> 4/3 * π * r³

radius = 2
print("Radius: {radius}")
print("Diameter: " + diameter(radius))
print("Circumference: " + circumference(radius)/π + "π")
print("Surface Area: " + surface_area(radius)/π + "π")
print("Volume: " + volume(radius)/π + "π")