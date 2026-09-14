import sys

with open("apps/web/src/components/ReportExportToolbar.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_props = """interface ReportExportToolbarProps {
  onDateChange: (start: string, end: string) => void;
  onExport: (format: 'pdf' | 'csv' | 'print') => void;
}

export default function ReportExportToolbar({ onDateChange, onExport }: ReportExportToolbarProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);"""

new_props = """interface ReportExportToolbarProps {
  onDateChange: (start: string, end: string) => void;
  onExport: (format: 'pdf' | 'csv' | 'print') => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export default function ReportExportToolbar({ onDateChange, onExport, initialStartDate, initialEndDate }: ReportExportToolbarProps) {
  const [startDate, setStartDate] = useState(initialStartDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialEndDate || new Date().toISOString().split('T')[0]);"""

code = code.replace(old_props, new_props)

with open("apps/web/src/components/ReportExportToolbar.tsx", "w", encoding="utf-8") as f:
    f.write(code)
