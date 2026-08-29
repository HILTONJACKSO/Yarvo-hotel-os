'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { AlertCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW']),
  cancellationReason: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reservation: any;
}

export function ManageReservationModal({ isOpen, onClose, onSuccess, reservation }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const selectedStatus = watch('status');

  useEffect(() => {
    if (isOpen && reservation) {
      reset({
        status: reservation.status as any,
        cancellationReason: '',
      });
      setSubmitError(null);
    }
  }, [isOpen, reservation, reset]);

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    try {
      const payload: any = { status: data.status };
      if (data.status === 'CANCELLED' && data.cancellationReason) {
        payload.cancellationReason = data.cancellationReason;
      }

      const res = await fetch(`/api/v1/reservations/${reservation.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update reservation');
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  if (!reservation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Reservation: ${reservation.confirmationCode}`}>
      <div className="reservation-details">
        <p><strong>Guest:</strong> {reservation.guest?.lastName}, {reservation.guest?.firstName}</p>
        <p><strong>Dates:</strong> {new Date(reservation.checkInDate).toLocaleDateString()} to {new Date(reservation.checkOutDate).toLocaleDateString()}</p>
        <p><strong>Current Status:</strong> {reservation.status}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="manage-reservation-form">
        {submitError && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{submitError}</span>
          </div>
        )}

        <div className="form-group">
          <label>Update Status</label>
          <select {...register('status')} className={errors.status ? 'error' : ''}>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
          {errors.status && <span className="error-text">{errors.status.message}</span>}
        </div>

        {selectedStatus === 'CANCELLED' && (
          <div className="form-group">
            <label>Cancellation Reason</label>
            <textarea {...register('cancellationReason')} rows={3} placeholder="Guest requested cancellation..." />
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="spinner" size={16} /> : 'Save Changes'}
          </button>
        </div>
      </form>

      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .reservation-details {
          background: hsl(222, 35%, 10%);
          padding: 16px; border-radius: 8px; margin-bottom: 20px;
          border: 1px solid hsl(217, 20%, 18%);
          font-size: 0.875rem; color: hsl(210, 40%, 92%);
        }
        .reservation-details p { margin: 0 0 8px 0; }
        .reservation-details p:last-child { margin-bottom: 0; }
        .reservation-details strong { color: hsl(215, 20%, 65%); }

        .manage-reservation-form {
          display: flex; flex-direction: column; gap: 16px;
        }

        .form-group {
          display: flex; flex-direction: column; gap: 6px;
        }

        .form-group label {
          font-size: 0.875rem; font-weight: 500; color: hsl(210, 40%, 85%);
        }

        .form-group select, .form-group textarea {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 20%);
          border-radius: 8px;
          padding: 10px 12px;
          color: hsl(210, 40%, 96%);
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .form-group select:focus, .form-group textarea:focus {
          outline: none; border-color: hsl(43, 96%, 56%);
        }
        .form-group select.error {
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

