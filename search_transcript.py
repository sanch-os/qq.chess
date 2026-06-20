import json
import sys

transcript_path = r'C:\Users\sanyo\.gemini\antigravity\brain\5d486e17-6a6e-4309-ab72-a1f0fad3e5d7\.system_generated\logs\transcript.jsonl'
output_path = r'C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\search_output.txt'

try:
    with open(transcript_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    results = []
    for line in lines:
        try:
            data = json.loads(line)
            content = data.get('content', '')
            if content and isinstance(content, str):
                if '100' in content and 'предмет' in content.lower():
                    results.append(content)
        except:
            pass

    with open(output_path, 'w', encoding='utf-8') as out_f:
        if results:
            for i, r in enumerate(results):
                out_f.write(f"--- MATCH {i} ---\n{r[:1000]}\n\n")
        else:
            out_f.write("No matches found for '100' and 'предмет'.\n")
            
except Exception as e:
    with open(output_path, 'w', encoding='utf-8') as out_f:
        out_f.write(str(e))
