'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { AlertCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff: any;
}

export function EditStaffModal({ isOpen, onClose, onSuccess, staff }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      
      // Fetch roles
      fetch('/api/v1/users/roles')
        .then(res => res.json())
        .then(json => {
          if (json.data) setRoles(json.data);
        })
        .catch(err => console.error('Failed to load roles', err));

      if (staff) {
        reset({
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          roleIds: staff.roles?.map((r: any) => r.id) || [],
          isActive: staff.isActive,
        });
      }
    }
  }, [isOpen, staff, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!staff) return;
    setSubmitError(null);
    try {
      const res = await fetch(`/api/v1/users/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update staff');
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  const handleDeactivate = () => {
    if (!staff) return;
    setConfirmAction({
      message: 'Are you sure you want to completely deactivate this user? They will no longer be able to log in.',
      onConfirm: async () => {
        setSubmitError(null);
        try {
          const res = await fetch(`/api/v1/users/${staff.id}`, {
            method: 'DELETE',
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.message || 'Failed to deactivate staff');
          
          onSuccess();
          onClose();
        } catch (err: any) {
          setSubmitError(err.message);
        }
      }
    });
  };

  return (
    <>
      <ConfirmModal 
        isOpen={confirmAction !== null}
        title="Deactivate Staff"
        message={confirmAction?.message || ''}
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
        isDanger={true}
        confirmText="Yes, Deactivate"
      />
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Staff Member">
      <form onSubmit={handleSubmit(onSubmit)} className="staff-form">
        {submitError && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{submitError}</span>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input {...register('firstName')} className={errors.firstName ? 'error' : ''} />
            {errors.firstName && <span className="error-text">{errors.firstName.message}</span>}
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input {...register('lastName')} className={errors.lastName ? 'error' : ''} />
            {errors.lastName && <span className="error-text">{errors.lastName.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input type="email" {...register('email')} className={errors.email ? 'error' : ''} />
          {errors.email && <span className="error-text">{errors.email.message}</span>}
        </div>

        <div className="form-group">
          <label>Assign Roles</label>
          <div className="roles-checklist">
            {roles.map((role) => (
              <label key={role.id} className="role-checkbox-label">
                <input 
                  type="checkbox" 
                  value={role.id} 
                  {...register('roleIds')} 
                />
                {role.name.replace('_', ' ')}
              </label>
            ))}
          </div>
          {errors.roleIds && <span className="error-text">{errors.roleIds.message}</span>}
        </div>

        <div className="form-group checkbox-group">
          <input type="checkbox" id="isActive" {...register('isActive')} />
          <label htmlFor="isActive">Account is Active (can login)</label>
        </div>

        <div className="form-actions-split">
          <button type="button" className="btn-danger" onClick={handleDeactivate} disabled={isSubmitting}>
            Deactivate User
          </button>
          
          <div className="actions-right">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="spinner" size={16} /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .staff-form { display: flex; flex-direction: column; gap: 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.875rem; font-weight: 500; color: hsl(210, 40%, 85%); }

        .checkbox-group { flex-direction: row; align-items: center; gap: 8px; margin-top: 8px; }
        .checkbox-group input { width: 16px; height: 16px; accent-color: hsl(43, 96%, 56%); cursor: pointer; }
        .checkbox-group label { cursor: pointer; }

        .form-group input:not([type="checkbox"]), .form-group select {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 20%);
          border-radius: 8px;
          padding: 10px 12px;
          color: hsl(210, 40%, 96%);
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .form-group input:not([type="checkbox"]):focus, .form-group select:focus { outline: none; border-color: hsl(43, 96%, 56%); }
        .form-group input.error, .form-group select.error { border-color: hsl(0, 84%, 60%); }

        .roles-checklist { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
        .role-checkbox-label { display: flex; align-items: center; gap: 8px; color: hsl(210, 40%, 96%); font-size: 0.875rem; cursor: pointer; }
        .role-checkbox-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: hsl(43, 96%, 56%); cursor: pointer; margin: 0; padding: 0; }

        .error-text { font-size: 0.75rem; color: hsl(0, 84%, 60%); }

        .error-alert {
          display: flex; align-items: center; gap: 8px; padding: 12px;
          background: hsl(0, 84%, 60%, 0.1); border: 1px solid hsl(0, 84%, 60%, 0.3);
          border-radius: 8px; color: hsl(0, 84%, 65%); font-size: 0.875rem;
        }

        .form-actions-split { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 20px; border-top: 1px solid hsl(217, 20%, 14%); }
        .actions-right { display: flex; gap: 12px; }
        
        .btn-cancel { background: transparent; border: 1px solid hsl(217, 20%, 25%); color: hsl(210, 40%, 96%); padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .btn-cancel:hover { background: hsl(217, 20%, 18%); }
        
        .btn-submit { display: flex; align-items: center; justify-content: center; gap: 8px; background: hsl(43, 96%, 56%); color: hsl(224, 39%, 6%); border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .btn-submit:hover:not(:disabled) { background: hsl(43, 96%, 60%); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        .btn-danger { background: hsl(0, 84%, 60%, 0.1); color: hsl(0, 84%, 65%); border: 1px solid hsl(0, 84%, 60%, 0.3); padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
        .btn-danger:hover:not(:disabled) { background: hsl(0, 84%, 60%, 0.2); }
      `}</style>
    </Modal>
    </>
  );
}

