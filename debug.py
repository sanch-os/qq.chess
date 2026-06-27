import re

with open(r'C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\app.js', encoding='utf-8') as f:
    content = f.read()

# We need to add winrate to occurrences 3 and 5 (the "buy" shop item cards)
# Occurrence 3 at pos ~23737: the first shop panel
# Occurrence 5 at pos ~26580: the second shop panel (stash side)

# Pattern to find: 
# const tDesc = window.t_item(item, 'description');
# followed by el.innerHTML with item-name containing tName but no wrBadge

old_block = '''const tDesc = window.t_item(item, 'description');
            el.innerHTML = `
                <div class="item-icon">${item.icon || '\U0001f4e6'}</div>
                <div class="item-name">${tName}</div>
                <div class="item-cost">${item.cost} \U0001fa99</div>
                <div class="item-tooltip">${tDesc}</div>
            `;'''

new_block = '''const tDesc = window.t_item(item, 'description');
            const _wr = ItemStats.format(item.id);
            const _wrBadge = _wr !== '\\u2014' ? `<span class="item-winrate">${_wr}</span>` : '';
            el.innerHTML = `
                <div class="item-icon">${item.icon || '\U0001f4e6'}</div>
                <div class="item-name">${tName}${_wrBadge}</div>
                <div class="item-cost">${item.cost} \U0001fa99</div>
                <div class="item-tooltip">${tDesc}</div>
            `;'''

count = content.count(old_block)
print(f"Found {count} occurrences")
content = content.replace(old_block, new_block)

with open(r'C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
