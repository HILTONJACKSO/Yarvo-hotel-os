import os
import re

directory = 'apps/web/src'
extensions = ['.tsx', '.ts']

# Regex to match: {obj.lastName}, {obj.firstName}
# Group 1: obj string (e.g. res.guest)
# We want to replace it with: {obj.firstName} {obj.lastName}

pattern = re.compile(r'\{([a-zA-Z0-9_\.\?]+)\.lastName\},\s*\{([a-zA-Z0-9_\.\?]+)\.firstName\}')

for root, dirs, files in os.walk(directory):
    for file in files:
        if any(file.endswith(ext) for ext in extensions):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub(r'{\2.firstName} {\1.lastName}', content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
