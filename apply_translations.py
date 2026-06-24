import re
import json

with open(r'C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\items-db.js', encoding='utf-8') as f:
    items_src = f.read()

with open(r'C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\translated.json', encoding='utf-8') as f:
    translations = json.load(f)

for item_id, trans in translations.items():
    # Replace name
    pattern_name = r"(" + item_id + r":\s*\{[\s\S]*?name:\s*['\"])(.*?)(['\"],\s*description:)"
    # We need to replace the string value with the object
    def replacer_name(match):
        name_obj = '{ ru: "' + trans["name"]["ru"].replace('"', '\\"') + '", en: "' + trans["name"]["en"].replace('"', '\\"') + '", es: "' + trans["name"]["es"].replace('"', '\\"') + '" }'
        return match.group(1)[:-1] + name_obj + match.group(3)[1:] # Removing quotes around the original string
    
    # A safer regex that catches the entire string field
    pattern_name_safe = r"(" + item_id + r":\s*\{[\s\S]*?name:\s*)(['\"].*?['\"])(,\s*description:)"
    def rep_name(m):
        name_obj = '{ ru: "' + trans["name"]["ru"].replace('"', '\\"') + '", en: "' + trans["name"]["en"].replace('"', '\\"') + '", es: "' + trans["name"]["es"].replace('"', '\\"') + '" }'
        return m.group(1) + name_obj + m.group(3)
    
    items_src = re.sub(pattern_name_safe, rep_name, items_src)

    # Replace description
    pattern_desc_safe = r"(" + item_id + r":\s*\{[\s\S]*?description:\s*)(['\"].*?['\"])(,\s*(?:difficulty|icon|rarity):)"
    def rep_desc(m):
        desc_obj = '{ ru: "' + trans["description"]["ru"].replace('"', '\\"') + '", en: "' + trans["description"]["en"].replace('"', '\\"') + '", es: "' + trans["description"]["es"].replace('"', '\\"') + '" }'
        return m.group(1) + desc_obj + m.group(3)
    
    items_src = re.sub(pattern_desc_safe, rep_desc, items_src)

with open(r'C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\items-db.js', "w", encoding="utf-8") as f:
    f.write(items_src)

print("Items updated successfully!")
