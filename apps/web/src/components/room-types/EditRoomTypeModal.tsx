'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { AlertCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  code: z.string().min(1, 'Code is required').max(10),
  description: z.string().optional(),
  baseRateUsd: z.number().min(0, 'Rate must be positive'),
  maxOccupancy: z.number().min(1, 'At least 1 person'),
});

type FormValues = z.infer<typeof schema>;

type RoomType = {
  id: string;
  name: string;
  code: string;
  description: string;
  maxOccupancy: number;
  baseRateUsd: number;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomType: RoomType | null;
}

export function EditRoomTypeModal({ isOpen, onClose, onSuccess, roomType }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen && roomType) {
      reset({
        name: roomType.name,
        code: roomType.code,
        description: roomType.description,
        baseRateUsd: Number(roomType.baseRateUsd),
        maxOccupancy: roomType.maxOccupancy,
      });
      setSubmitError(null);
    }
  }, [isOpen, roomType, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!roomType) return;
    setSubmitError(null);
    try {
      const payload = {
        ...data,
        maxAdults: data.maxOccupancy,
        maxChildren: Math.max(0, data.maxOccupancy - 1),
        baseRateLrd: Number((data.baseRateUsd * 190).toFixed(2)) // Default LRD conversion
      };

      const res = await fetch(`/api/v1/room-types/${roomType.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update room type');
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Room Type">
      <form onSubmit={handleSubmit(onSubmit)} className="edit-room-type-form">
        {submitError && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{submitError}</span>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input type="text" {...register('name')} className={errors.name ? 'error' : ''} />
            {errors.name && <span className="error-text">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>Code</label>
            <input type="text" {...register('code')} className={errors.code ? 'error' : ''} />
            {errors.code && <span className="error-text">{errors.code.message}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Base Rate (USD)</label>
            <input type="number" step="0.01" min="0" {...register('baseRateUsd', { valueAsNumber: true })} className={errors.baseRateUsd ? 'error' : ''} />
            {errors.baseRateUsd && <span className="error-text">{errors.baseRateUsd.message}</span>}
          </div>

          <div className="form-group">
            <label>Max Occupancy</label>
            <input type="number" min="1" {...register('maxOccupancy', { valueAsNumber: true })} className={errors.maxOccupancy ? 'error' : ''} />
            {errors.maxOccupancy && <span className="error-text">{errors.maxOccupancy.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea {...register('description')} rows={3} />
        </div>

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

        .edit-room-type-form {
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

        .form-group input, .form-group textarea {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 20%);
          border-radius: 8px;
          padding: 10px 12px;
          color: hsl(210, 40%, 96%);
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group textarea:focus {
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

