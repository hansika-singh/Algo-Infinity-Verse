with open('/workspaces/Algo-Infinity-Verse/script.js', 'r') as f:
    lines = f.readlines()

# Track braces, parens, brackets
braces = 0
parens = 0
brackets = 0
in_string = False
in_template = False
string_char = None
escape = False

for i, line in enumerate(lines):
    line_num = i + 1
    for j, ch in enumerate(line):
        if escape:
            escape = False
            continue
        if ch == '\\':
            escape = True
            continue
            
        if not in_string and not in_template:
            if ch == '"' or ch == "'":
                in_string = True
                string_char = ch
            elif ch == '`':
                in_template = True
                print(f"Line {line_num}: OPEN template")
            elif ch == '{':
                braces += 1
            elif ch == '}':
                braces -= 1
            elif ch == '(':
                parens += 1
            elif ch == ')':
                parens -= 1
            elif ch == '[':
                brackets += 1
            elif ch == ']':
                brackets -= 1
        elif in_string:
            if ch == string_char:
                in_string = False
                string_char = None
        elif in_template:
            if ch == '`':
                in_template = False
                print(f"Line {line_num}: CLOSE template")
    
    if brackets < 0:
        print(f"Line {line_num}: Negative brackets ({brackets}), in_template={in_template}, in_string={in_string}")

print(f"Final: braces={braces}, parens={parens}, brackets={brackets}, in_string={in_string}, in_template={in_template}")