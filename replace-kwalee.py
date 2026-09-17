import os

directories = ["apps/web/src"]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace("KWAALEE", "KWALEE")
    new_content = new_content.replace("Kwaalee", "Kwalee")
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(directories[0]):
    for file in files:
        if file.endswith((".tsx", ".ts", ".jsx", ".js", ".html", ".css")):
            filepath = os.path.join(root, file)
            process_file(filepath)
print("Done replacing.")
