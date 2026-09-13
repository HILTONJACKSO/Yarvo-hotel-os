import sys

content = """'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { AlertCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW']),
  cancellationReason: z.string().optional(),
  
  // Guest fields
  guestFirstName: z.string().min(1, 'First name is required'),
  guestLastName: z.string().min(1, 'Last name is required'),
  guestEmail: z.string().optional(),
  guestPhone: z.string().optional(),
  
  // Booking fields
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  roomTypeId: z.string().min(1, 'Room type is required'),
  roomId: z.string().optional(),
  adultsCount: z.number().min(1),
  childrenCount: z.number().min(0),
  specialRequests: z.string().optional(),
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
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

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
  const watchRoomTypeId = watch('roomTypeId');

  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      Promise.all([
        fetch('/api/v1/room-types').then(r => r.json()),
        fetch('/api/v1/rooms').then(r => r.json()),
      ]).then(([rtData, roomData]) => {
        setRoomTypes(rtData.data || []);
        setRooms(roomData.data || []);
      }).finally(() => {
        setLoadingData(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && reservation) {
      reset({
        status: reservation.status as any,
        cancellationReason: reservation.cancellationReason || '',
        guestFirstName: reservation.guest?.firstName || '',
        guestLastName: reservation.guest?.lastName || '',
        guestEmail: reservation.guest?.email || '',
        guestPhone: reservation.guest?.phone || '',
        checkInDate: new Date(reservation.checkInDate).toISOString().split('T')[0],
        checkOutDate: new Date(reservation.checkOutDate).toISOString().split('T')[0],
        roomTypeId: reservation.roomTypeId,
        roomId: reservation.roomId || '',
        adultsCount: reservation.adultsCount,
        childrenCount: reservation.childrenCount,
        specialRequests: reservation.specialRequests || '',
      });
      setSubmitError(null);
    }
  }, [isOpen, reservation, reset]);

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    try {
      const payload: any = { 
        ...data,
        checkInDate: new Date(data.checkInDate).toISOString(),
        checkOutDate: new Date(data.checkOutDate).toISOString(),
      };
      
      if (!payload.roomId) {
        delete payload.roomId;
      }

      if (data.status !== 'CANCELLED') {
        delete payload.cancellationReason;
      }

      // Use the newly added full update endpoint
      const res = await fetch(`/api/v1/reservations/${reservation.id}`, {
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Reservation: ${reservation.confirmationCode}`}>
      {loadingData ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="manage-reservation-form">
          {submitError && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Update Status</label>
              <select {...register('status')} className={errors.status ? 'error' : ''}>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN" disabled>Checked In (Use Front Desk)</option>
                <option value="CHECKED_OUT" disabled>Checked Out (Use Front Desk)</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>
              {errors.status && <span className="error-text">{errors.status.message}</span>}
            </div>
          </div>

          {selectedStatus === 'CANCELLED' && (
            <div className="form-group">
              <label>Cancellation Reason</label>
              <textarea {...register('cancellationReason')} rows={2} placeholder="Guest requested cancellation..." />
            </div>
          )}

          <hr className="divider" />
          <h4 className="section-title">Guest Details</h4>

          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input {...register('guestFirstName')} className={errors.guestFirstName ? 'error' : ''} />
              {errors.guestFirstName && <span className="error-text">{errors.guestFirstName.message}</span>}
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input {...register('guestLastName')} className={errors.guestLastName ? 'error' : ''} />
              {errors.guestLastName && <span className="error-text">{errors.guestLastName.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" {...register('guestEmail')} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input {...register('guestPhone')} />
            </div>
          </div>

          <hr className="divider" />
          <h4 className="section-title">Booking Details</h4>

          <div className="form-row">
            <div className="form-group">
              <label>Check-In Date</label>
              <input type="date" {...register('checkInDate')} className={errors.checkInDate ? 'error' : ''} />
              {errors.checkInDate && <span className="error-text">{errors.checkInDate.message}</span>}
            </div>
            <div className="form-group">
              <label>Check-Out Date</label>
              <input type="date" {...register('checkOutDate')} className={errors.checkOutDate ? 'error' : ''} />
              {errors.checkOutDate && <span className="error-text">{errors.checkOutDate.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Room Type</label>
              <select {...register('roomTypeId')} className={errors.roomTypeId ? 'error' : ''}>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
              {errors.roomTypeId && <span className="error-text">{errors.roomTypeId.message}</span>}
            </div>
            <div className="form-group">
              <label>Assign Specific Room</label>
              <select {...register('roomId')}>
                <option value="">-- Unassigned --</option>
                {rooms.filter(r => r.roomTypeId === watchRoomTypeId).map((r) => (
                  <option key={r.id} value={r.id}>Room {r.number} - {r.status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Adults</label>
              <input type="number" min="1" {...register('adultsCount', { valueAsNumber: true })} className={errors.adultsCount ? 'error' : ''} />
            </div>
            <div className="form-group">
              <label>Children</label>
              <input type="number" min="0" {...register('childrenCount', { valueAsNumber: true })} />
            </div>
          </div>
          
          <div className="form-group">
            <label>Special Requests</label>
            <textarea {...register('specialRequests')} rows={2} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="spinner" size={16} /> : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .manage-reservation-form {
          display: flex; flex-direction: column; gap: 16px;
          max-height: 70vh;
          overflow-y: auto;
          padding-right: 8px;
        }

        .manage-reservation-form::-webkit-scrollbar {
          width: 6px;
        }
        .manage-reservation-form::-webkit-scrollbar-thumb {
          background: hsl(217, 20%, 25%);
          border-radius: 3px;
        }

        .form-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }

        .divider {
          border: 0; height: 1px; background: hsl(217, 20%, 18%); margin: 8px 0;
        }

        .section-title {
          margin: 0; font-size: 0.95rem; color: hsl(43, 96%, 56%); font-weight: 600;
        }

        .form-group {
          display: flex; flex-direction: column; gap: 6px;
        }

        .form-group label {
          font-size: 0.875rem; font-weight: 500; color: hsl(210, 40%, 85%);
        }

        .form-group select, .form-group textarea, .form-group input {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 20%);
          border-radius: 8px;
          padding: 10px 12px;
          color: hsl(210, 40%, 96%);
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        
        .form-group select:focus, .form-group textarea:focus, .form-group input:focus {
          outline: none; border-color: hsl(43, 96%, 56%);
        }
        
        .form-group select.error, .form-group input.error {
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
          position: sticky; bottom: 0; background: hsl(222, 47%, 11%);
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
"""

with open("apps/web/src/components/reservations/ManageReservationModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
