'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { AlertCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  roomId: z.string().min(1, 'Please assign a room'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reservationId: string | null;
  roomTypeId: string | null;
}

export function CheckInModal({ isOpen, onClose, onSuccess, reservationId, roomTypeId }: Props) {
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
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
    if (!isOpen || !roomTypeId) return;
    
    const fetchRooms = async () => {
      setLoadingData(true);
      try {
        // Fetch rooms matching the reservation's roomType that are currently AVAILABLE
        const res = await fetch(`/api/v1/rooms?typeId=${roomTypeId}&status=AVAILABLE`);
        if (res.ok) {
          const json = await res.json();
          setAvailableRooms(json.data || json || []);
        }
      } catch (err) {
        console.error('Failed to load available rooms', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchRooms();
    reset();
    setSubmitError(null);
  }, [isOpen, roomTypeId, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!reservationId) return;
    setSubmitError(null);
    try {
      const res = await fetch(`/api/v1/reservations/${reservationId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: data.roomId,
        }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to check in');
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Check-In Guest">
      {loadingData ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={24} />
          <span>Finding clean rooms...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="checkin-form">
          {submitError && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}
          
          <div className="info-box">
            <p>Please select a clean room to assign to this reservation.</p>
          </div>

          <div className="form-group">
            <label>Assign Room</label>
            <select {...register('roomId')} className={errors.roomId ? 'error' : ''}>
              <option value="">-- Select Room --</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>Room {r.number}</option>
              ))}
            </select>
            {errors.roomId && <span className="error-text">{errors.roomId.message}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting || availableRooms.length === 0}>
              {isSubmitting ? <Loader2 className="spinner" size={16} /> : 'Complete Check-In'}
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

        .checkin-form {
          display: flex; flex-direction: column; gap: 16px;
        }

        .info-box {
          background: hsl(220, 30%, 10%);
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid hsl(217, 20%, 20%);
          color: hsl(210, 40%, 85%);
          font-size: 0.875rem;
        }

        .form-group {
          display: flex; flex-direction: column; gap: 6px;
        }

        .form-group label {
          font-size: 0.875rem; font-weight: 500; color: hsl(210, 40%, 85%);
        }

        .form-group select {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 20%);
          border-radius: 8px;
          padding: 10px 12px;
          color: hsl(210, 40%, 96%);
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .form-group select:focus {
          outline: none; border-color: hsl(142, 76%, 36%);
        }
        .form-group select.error {
          border-color: hsl(0, 84%, 60%);
        }

        .error-text { font-size: 0.75rem; color: hsl(0, 84%, 60%); }

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
          background: hsl(142, 76%, 36%); color: hsl(0, 0%, 100%);
          border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600;
          cursor: pointer; transition: background 0.2s;
        }
        .btn-submit:hover:not(:disabled) { background: hsl(142, 76%, 40%); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
    </Modal>
  );
}

