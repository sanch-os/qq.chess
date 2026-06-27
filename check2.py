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

    if braces == 0:
        pass # print(f"Balanced at {i+1}")

print(f"Final braces: {braces}")

if braces > 0:
    # Let's find the last line that was at level 0
    b = 0
    last_zero = 0
    for i, line in enumerate(lines):
        line_clean = re.sub(r'//.*', '', line)
        line_clean = re.sub(r"\'[^\']*\'", "", line_clean)
        line_clean = re.sub(r'\"[^\"]*\"', "", line_clean)
        line_clean = re.sub(r'\`[^\`]*\`', "", line_clean)
        for c in line_clean:
            if c == '{': b += 1
            elif c == '}': b -= 1
        if b == 0:
            last_zero = i + 1
    print(f"Last time braces were 0 was at line {last_zero}")
