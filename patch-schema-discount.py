import os

schema_path = "packages/database/prisma/schema.prisma"
with open(schema_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add discountReason String? @db.Text or VarChar
# Find `discountAmount Decimal    @default(0) @db.Decimal(10, 2)`
old_line = "discountAmount Decimal    @default(0) @db.Decimal(10, 2)"
new_line = "discountAmount Decimal    @default(0) @db.Decimal(10, 2)\n  discountReason String?    @db.VarChar(255)"

if old_line in content:
    content = content.replace(old_line, new_line)
    with open(schema_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched schema.prisma")
else:
    print("Could not find old_line in schema.prisma")
