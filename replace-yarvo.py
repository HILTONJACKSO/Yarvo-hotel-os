import os
import re

directories = ['apps/web/src', 'packages', 'apps/api/src']
extensions = ['.tsx', '.ts', '.js', '.json', '.html', '.css', '.md']

replacements = [
    (r'\bYarvo\b', 'Kwalee'),
    (r'\bYARVO\b', 'KWALEE'),
    (r'\byarvo\b', 'kwalee')
]

for directory in directories:
    for root, dirs, files in os.walk(directory):
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    for old, new in replacements:
                        new_content = re.sub(old, new, new_content)
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated {filepath}")
                except Exception as e:
                    print(f"Failed {filepath}: {e}")
