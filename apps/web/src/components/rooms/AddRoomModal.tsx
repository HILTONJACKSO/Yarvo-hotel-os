'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { AlertCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  number: z.string().min(1, 'Room number is required').max(10, 'Room number too long'),
  floor: z.number().min(1, 'Floor must be at least 1').max(100, 'Floor must be less than 100'),
  roomTypeId: z.string().min(1, 'Please select a room type'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export function AddRoomModal({ isOpen, onClose, onSuccess, initialData }: Props) {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      floor: 1,
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchRoomTypes = async () => {
      setLoadingData(true);
      try {
        const res = await fetch('/api/v1/room-types');
        if (res.ok) {
          const json = await res.json();
          setRoomTypes(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load room types', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchRoomTypes();
    
    if (initialData) {
      reset({
        number: initialData.number,
        floor: initialData.floor,
        roomTypeId: initialData.roomType?.id || initialData.roomTypeId,
        notes: initialData.notes || '',
      });
    } else {
      reset({ floor: 1, number: '', roomTypeId: '', notes: '' });
    }
    
    setSubmitError(null);
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    try {
      const url = initialData ? `/api/v1/rooms/${initialData.id}` : '/api/v1/rooms';
      const method = initialData ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Failed to ${initialData ? 'edit' : 'add'} room`);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Room" : "Add New Room"}>
      {loadingData ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={24} />
          <span>Loading room types...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="add-room-form">
          {submitError && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Room Number</label>
              <input type="text" {...register('number')} className={errors.number ? 'error' : ''} placeholder="e.g. 101" />
              {errors.number && <span className="error-text">{errors.number.message}</span>}
            </div>

            <div className="form-group">
              <label>Floor</label>
              <input type="number" min="1" max="100" {...register('floor', { valueAsNumber: true })} className={errors.floor ? 'error' : ''} />
              {errors.floor && <span className="error-text">{errors.floor.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Room Type</label>
            <select {...register('roomTypeId')} className={errors.roomTypeId ? 'error' : ''}>
              <option value="">-- Select Room Type --</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name} ({rt.code})</option>
              ))}
            </select>
            {errors.roomTypeId && <span className="error-text">{errors.roomTypeId.message}</span>}
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea {...register('notes')} rows={3} placeholder="Corner room, great sea view..." />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="spinner" size={16} /> : (initialData ? 'Save Changes' : 'Add Room')}
            </button>
          </div>
        </form>
      )}

      <style>{`
        .loading-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 40px; color: hsl(215, 20%, 55%);
        }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .add-room-form {
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

        .form-group input, .form-group select, .form-group textarea {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 20%);
          border-radius: 8px;
          padding: 10px 12px;
          color: hsl(210, 40%, 96%);
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none; border-color: hsl(43, 96%, 56%);
        }
        .form-group input.error, .form-group select.error {
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

