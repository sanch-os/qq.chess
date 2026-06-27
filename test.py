import re

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
braces = 0
for i, line in enumerate(lines):
    line_clean = re.sub(r'//.*', '', line)
    line_clean = re.sub(r"\'[^\']*\'", "", line_clean)
    line_clean = re.sub(r'\"[^\"]*\"', "", line_clean)
    line_clean = re.sub(r'\`[^\`]*\`', "", line_clean)
    for c in line_clean:
        if c == '{': braces += 1
        elif c == '}': braces -= 1
    if braces < 0:
        print(f"Negative braces at line {i+1}")
        break

print(f"Final braces: {braces}")

if braces > 0:
    # Try to find where it starts increasing
    b = 0
    for i, line in enumerate(lines):
        line_clean = re.sub(r'//.*', '', line)
        line_clean = re.sub(r"\'[^\']*\'", "", line_clean)
        line_clean = re.sub(r'\"[^\"]*\"', "", line_clean)
        line_clean = re.sub(r'\`[^\`]*\`', "", line_clean)
        for c in line_clean:
            if c == '{': b += 1
            elif c == '}': b -= 1
        if b == braces:
            print(f"Braces reach +{braces} around line {i+1}")
