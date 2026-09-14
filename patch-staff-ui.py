import sys
import re

with open("apps/web/src/app/dashboard/staff/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# We need to import useAuth
if "useAuth" not in code:
    code = code.replace("import { OverviewTab } from '@/components/staff/OverviewTab';", 
                        "import { OverviewTab } from '@/components/staff/OverviewTab';\nimport { useAuth } from '@/hooks/useAuth';")

# Find StaffPage component
code = code.replace("export default function StaffPage() {", "export default function StaffPage() {\n  const { user } = useAuth();\n  const isManager = user?.roles?.some((r: string) => ['super_admin', 'admin', 'ceo', 'manager'].includes(r));")

# Modify activeTab default
code = code.replace("const [activeTab, setActiveTab] = useState<Tab>('overview');", 
                    "const [activeTab, setActiveTab] = useState<Tab>(isManager ? 'overview' : 'attendance');")

# Protect tabs UI
old_tabs = """<div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`tab ${activeTab === 'directory' ? 'active' : ''}`} onClick={() => setActiveTab('directory')}>Directory</button>
          <button className={`tab ${activeTab === 'shifts' ? 'active' : ''}`} onClick={() => setActiveTab('shifts')}>Shifts</button>
          <button className={`tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>Attendance</button>
          <button className={`tab ${activeTab === 'payroll' ? 'active' : ''}`} onClick={() => setActiveTab('payroll')}>Payroll</button>
        </div>"""

new_tabs = """<div className="tabs">
          {isManager && <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>}
          {isManager && <button className={`tab ${activeTab === 'directory' ? 'active' : ''}`} onClick={() => setActiveTab('directory')}>Directory</button>}
          {isManager && <button className={`tab ${activeTab === 'shifts' ? 'active' : ''}`} onClick={() => setActiveTab('shifts')}>Shifts</button>}
          <button className={`tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>Attendance</button>
          <button className={`tab ${activeTab === 'payroll' ? 'active' : ''}`} onClick={() => setActiveTab('payroll')}>Payroll</button>
        </div>"""

code = code.replace(old_tabs, new_tabs)

# Protect views
code = code.replace("{activeTab === 'overview' && (", "{isManager && activeTab === 'overview' && (")
code = code.replace("{activeTab === 'directory' && (", "{isManager && activeTab === 'directory' && (")
code = code.replace("{activeTab === 'shifts' && (", "{isManager && activeTab === 'shifts' && (")


with open("apps/web/src/app/dashboard/staff/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
