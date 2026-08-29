'use client';

import { useState, useEffect } from 'react';
import { AddStaffModal } from '@/components/staff/AddStaffModal';
import { EditStaffModal } from '@/components/staff/EditStaffModal';
import { ShiftsTab } from '@/components/staff/ShiftsTab';
import { AttendanceTab } from '@/components/staff/AttendanceTab';
import { PayrollTab } from '@/components/staff/PayrollTab';
import { OverviewTab } from '@/components/staff/OverviewTab';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: { id: string; name: string }[];
};

export default function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  type Tab = 'overview' | 'directory' | 'shifts' | 'attendance' | 'payroll';
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users');
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setStaff(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch staff', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Staff Management</h2>
          <div className="tabs">
            <button className={activeTab === 'overview' ? 'tab active' : 'tab'} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={activeTab === 'directory' ? 'tab active' : 'tab'} onClick={() => setActiveTab('directory')}>Directory</button>
            <button className={activeTab === 'shifts' ? 'tab active' : 'tab'} onClick={() => setActiveTab('shifts')}>Shifts</button>
            <button className={activeTab === 'attendance' ? 'tab active' : 'tab'} onClick={() => setActiveTab('attendance')}>Attendance</button>
            <button className={activeTab === 'payroll' ? 'tab active' : 'tab'} onClick={() => setActiveTab('payroll')}>Payroll</button>
          </div>
        </div>
        {activeTab === 'directory' && (
          <button className="btn-primary" onClick={() => setIsAddOpen(true)}>
            + Add Staff
          </button>
        )}
      </div>

      <AddStaffModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={fetchStaff} 
      />

      <EditStaffModal
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        onSuccess={() => {
          setEditingStaff(null);
          fetchStaff();
        }}
        staff={editingStaff}
      />

      {activeTab === 'overview' && (
        <OverviewTab />
      )}

      {activeTab === 'directory' && (
        loading ? (
          <div className="loading-state">Loading staff directory...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">No staff found.</td>
                  </tr>
                ) : (
                  staff.map((user) => (
                    <tr key={user.id}>
                      <td className="font-medium">
                        {user.lastName}, {user.firstName}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <div className="role-badges">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map(role => (
                              <span key={role.id} className="role-badge">
                                {role.name.replace('_', ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="role-badge empty">No Roles</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={user.isActive ? 'status-active' : 'status-inactive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button className="action-btn" onClick={() => setEditingStaff(user)}>Edit</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'shifts' && (
        <ShiftsTab staff={staff} />
      )}

      {activeTab === 'attendance' && (
        <AttendanceTab staff={staff} />
      )}

      {activeTab === 'payroll' && (
        <PayrollTab staff={staff} />
      )}

      <style>{`
        .page-container { display: flex; flex-direction: column; gap: 24px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .page-header h2 { margin: 0 0 16px 0; color: hsl(210, 40%, 96%); font-weight: 600; }
        
        .tabs { display: flex; gap: 8px; border-bottom: 1px solid hsl(217, 20%, 18%); padding-bottom: -1px; margin-bottom: 16px; }
        .tab { background: transparent; border: none; padding: 8px 16px; color: hsl(215, 20%, 65%); cursor: pointer; font-weight: 500; font-size: 0.875rem; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab:hover { color: hsl(210, 40%, 96%); }
        .tab.active { color: hsl(43, 96%, 56%); border-bottom-color: hsl(43, 96%, 56%); }

        
        .btn-primary { background: hsl(43, 96%, 56%); color: hsl(224, 39%, 4%); border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
        .btn-primary:hover { opacity: 0.9; }

        .table-container { background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 14%); border-radius: 8px; overflow: hidden; }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th { background: hsl(220, 30%, 5%); padding: 12px 16px; font-size: 0.75rem; text-transform: uppercase; color: hsl(215, 20%, 50%); font-weight: 600; border-bottom: 1px solid hsl(217, 20%, 14%); }
        .data-table td { padding: 16px; border-bottom: 1px solid hsl(217, 20%, 12%); color: hsl(210, 40%, 92%); font-size: 0.875rem; }
        .data-table tbody tr:hover { background: hsl(220, 30%, 8%); }
        
        .font-medium { font-weight: 500; }
        
        .role-badges { display: flex; gap: 6px; flex-wrap: wrap; }
        .role-badge { background: hsl(217, 20%, 18%); color: hsl(210, 40%, 96%); padding: 4px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 600; white-space: nowrap; }
        .role-badge.empty { background: transparent; color: hsl(215, 20%, 50%); border: 1px dashed hsl(217, 20%, 25%); }
        
        .status-active { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: hsl(142, 76%, 36%, 0.15); color: hsl(142, 76%, 55%); }
        .status-inactive { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 65%); }
        
        .actions-col { width: 80px; text-align: right; }
        .actions-cell { text-align: right; }
        .action-btn { background: transparent; border: 1px solid hsl(217, 20%, 18%); color: hsl(210, 40%, 92%); padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        .action-btn:hover { background: hsl(217, 20%, 18%); }
        
        .empty-state { text-align: center; padding: 40px !important; color: hsl(215, 20%, 50%) !important; }
        .loading-state { text-align: center; padding: 40px; color: hsl(215, 20%, 50%); }
      `}</style>
    </div>
  );
}

