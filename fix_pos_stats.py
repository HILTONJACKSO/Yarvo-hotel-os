import re

file_path = "apps/api/src/modules/pos/pos.service.ts"
with open(file_path, "r") as f:
    content = f.read()

# Fix getDailyDepartmentStats
old_dept_include = """      include: {
        menuItem: true
      }"""
new_dept_include = """      include: {
        menuItem: true,
        order: true
      }"""

old_dept_revenue = """    const totalRevenue = items.reduce((sum, item) => sum + (Number(item.menuItem.price) * item.quantity), 0);"""
new_dept_revenue = """    const totalRevenue = items.reduce((sum, item) => {
      if (item.order && item.order.status === 'PAID') {
        return sum + (Number(item.menuItem.price) * item.quantity);
      }
      return sum;
    }, 0);"""

content = content.replace(old_dept_include, new_dept_include)
content = content.replace(old_dept_revenue, new_dept_revenue)


# Fix getDailyWaitstaffStats
old_wait_include = """      include: {
        menuItem: true,
      }"""
new_wait_include = """      include: {
        menuItem: true,
        order: true
      }"""

old_wait_revenue = """    const totalRevenue = items.reduce((sum, item) => sum + (Number(item.menuItem.price) * item.quantity), 0);"""
new_wait_revenue = """    const totalRevenue = items.reduce((sum, item) => {
      if (item.order && item.order.status === 'PAID') {
        return sum + (Number(item.menuItem.price) * item.quantity);
      }
      return sum;
    }, 0);"""

content = content.replace(old_wait_include, new_wait_include)
content = content.replace(old_wait_revenue, new_wait_revenue)

with open(file_path, "w") as f:
    f.write(content)

print("Fixed pos.service.ts")
