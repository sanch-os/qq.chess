import re
import json

with open(r'C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\items-db.js', encoding='utf-8') as f:
    src = f.read()

matches = re.findall(r'(\w+):\s*\{\s*id:.*?name:\s*[\'"](.*?)[\'"],\s*description:\s*[\'"](.*?)[\'"]', src, re.DOTALL)

res = {}
for m in matches:
    res[m[0]] = {"ru_name": m[1], "ru_desc": m[2]}

with open(r'C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\untranslated.json', "w", encoding="utf-8") as f:
    json.dump(res, f, ensure_ascii=False, indent=2)

print(f"Dumped {len(res)} items to untranslated.json")
