'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { AlertCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email').or(z.literal('')),
  phone: z.string().max(50).optional(),
  nationality: z.string().max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddGuestModal({ isOpen, onClose, onSuccess }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      phone: '',
      nationality: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset();
      setSubmitError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    try {
      const payload = {
        ...data,
        email: data.email === '' ? undefined : data.email,
        phone: data.phone === '' ? undefined : data.phone,
        nationality: data.nationality === '' ? undefined : data.nationality,
      };

      const res = await fetch('/api/v1/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to add guest');
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Guest">
      <form onSubmit={handleSubmit(onSubmit)} className="add-guest-form">
        {submitError && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{submitError}</span>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input type="text" {...register('firstName')} className={errors.firstName ? 'error' : ''} placeholder="John" />
            {errors.firstName && <span className="error-text">{errors.firstName.message}</span>}
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input type="text" {...register('lastName')} className={errors.lastName ? 'error' : ''} placeholder="Doe" />
            {errors.lastName && <span className="error-text">{errors.lastName.message}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" {...register('email')} className={errors.email ? 'error' : ''} placeholder="john@example.com" />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input type="text" {...register('phone')} className={errors.phone ? 'error' : ''} placeholder="+1 555 1234" />
            {errors.phone && <span className="error-text">{errors.phone.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Nationality</label>
          <input type="text" {...register('nationality')} className={errors.nationality ? 'error' : ''} placeholder="e.g. USA, UK, Canada..." />
          {errors.nationality && <span className="error-text">{errors.nationality.message}</span>}
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="spinner" size={16} /> : 'Add Guest'}
          </button>
        </div>
      </form>

      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .add-guest-form {
          display: flex; flex-direction: column; gap: 16px;
        }

        .form-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }

        .form-group {
          display: flex; flex-direction: column; gap: 6px;
        }

        .form-group label {
          font-size: 0.875rem; font-weight: 500; color: hsl(210, 40%, 85%);
        }

        .form-group input {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 20%);
          border-radius: 8px;
          padding: 10px 12px;
          color: hsl(210, 40%, 96%);
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
          outline: none; border-color: hsl(43, 96%, 56%);
        }
        .form-group input.error {
          border-color: hsl(0, 84%, 60%);
        }

        .error-text {
          font-size: 0.75rem; color: hsl(0, 84%, 60%);
        }

        .error-alert {
          display: flex; align-items: center; gap: 8px; padding: 12px;
          background: hsl(0, 84%, 60%, 0.1); border: 1px solid hsl(0, 84%, 60%, 0.3);
          border-radius: 8px; color: hsl(0, 84%, 65%); font-size: 0.875rem;
        }

        .form-actions {
          display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; padding-top: 20px;
          border-top: 1px solid hsl(217, 20%, 14%);
        }

        .btn-cancel {
          background: transparent; border: 1px solid hsl(217, 20%, 25%);
          color: hsl(210, 40%, 96%); padding: 10px 20px; border-radius: 8px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-cancel:hover { background: hsl(217, 20%, 18%); }

        .btn-submit {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: hsl(43, 96%, 56%); color: hsl(224, 39%, 6%);
          border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600;
          cursor: pointer; transition: background 0.2s;
        }
        .btn-submit:hover:not(:disabled) { background: hsl(43, 96%, 60%); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
    </Modal>
  );
}

