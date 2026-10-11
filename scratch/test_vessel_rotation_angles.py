import numpy as np

# Coordinates of the 3 anchors in unrotated heart:
anchors = {
    'lad': np.array([0.614, -0.856, 1.375]),
    'lcx': np.array([-0.876, 0.012, 2.225]),
    'rca': np.array([0.853, 0.146, 1.903])
}

# When heart is rotated by angle theta around Y:
# [x', y', z'] = [x * cos(theta) + z * sin(theta), y, -x * sin(theta) + z * cos(theta)]
# We want x' ~ 0 and z' > 0 (front facing camera):
for name, pt in anchors.items():
    # To bring x' to 0:
    # x * cos(theta) + z * sin(theta) = 0 => tan(theta) = -x / z
    theta = -np.arctan2(pt[0], pt[2])
    # check new position:
    c = np.cos(theta)
    s = np.sin(theta)
    new_x = pt[0] * c + pt[2] * s
    new_y = pt[1]
    new_z = -pt[0] * s + pt[2] * c
    print(f"{name.upper()}: anchor={pt.tolist()}")
    print(f"  Target theta = {theta:.3f} rad ({np.degrees(theta):.1f} deg)")
    print(f"  Rotated pos = [{new_x:.3f}, {new_y:.3f}, {new_z:.3f}] (z > 0 means facing camera directly)\n")
