'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { AlertCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  isNewGuest: z.boolean().optional(),
  guestId: z.string().optional(),
  guestFirstName: z.string().optional(),
  guestLastName: z.string().optional(),
  guestEmail: z.string().optional(),
  guestPhone: z.string().optional(),
  roomTypeId: z.string().min(1, 'Please select a room type'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  adultsCount: z.number().min(1, 'At least 1 adult is required'),
  childrenCount: z.number().min(0),
  companyId: z.string().optional(),
  specialRequests: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.isNewGuest) {
    if (!data.guestFirstName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "First name is required", path: ["guestFirstName"] });
    }
    if (!data.guestLastName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Last name is required", path: ["guestLastName"] });
    }
  } else {
    if (!data.guestId?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a guest", path: ["guestId"] });
    }
  }
  
  if (new Date(data.checkOutDate) <= new Date(data.checkInDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Check-out date must be after check-in date", path: ["checkOutDate"] });
  }
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewReservationModal({ isOpen, onClose, onSuccess }: Props) {
  const [guests, setGuests] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      adultsCount: 1,
      childrenCount: 0,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [gRes, rtRes, compRes] = await Promise.all([
          fetch('/api/v1/guests?limit=100'), // Quick hack: load first 100 guests for dropdown
          fetch('/api/v1/room-types'),
          fetch('/api/v1/companies')
        ]);
        
        if (gRes.ok) {
          const gData = await gRes.json();
          setGuests(gData.data || []);
        }
        if (rtRes.ok) {
          const rtData = await rtRes.json();
          setRoomTypes(rtData.data || []);
        }
        if (compRes.ok) {
          const compData = await compRes.json();
          setCompanies(compData.data || []);
        }
      } catch (err) {
        console.error('Failed to load form data', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
    reset(); // reset form on open
    setSubmitError(null);
  }, [isOpen, reset]);

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    try {
      const payload: any = {
        ...data,
        checkInDate: new Date(data.checkInDate).toISOString(),
        checkOutDate: new Date(data.checkOutDate).toISOString(),
      };
      
      delete payload.isNewGuest;
      if (!payload.guestId) {
        delete payload.guestId;
      }
      if (!payload.companyId) {
        delete payload.companyId;
      }

      const res = await fetch('/api/v1/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create reservation');
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Reservation">
      {loadingData ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={24} />
          <span>Loading guest list...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="reservation-form">
          {submitError && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" {...register('isNewGuest')} />
              <span>Create New Guest Instead</span>
            </label>
          </div>

          {!watch('isNewGuest') ? (
            <div className="form-group">
              <label>Guest</label>
              <select {...register('guestId')} className={errors.guestId ? 'error' : ''}>
                <option value="">-- Select Guest --</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>{g.firstName} {g.lastName} ({g.email})</option>
                ))}
              </select>
              {errors.guestId && <span className="error-text">{errors.guestId.message}</span>}
            </div>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input type="text" {...register('guestFirstName')} className={errors.guestFirstName ? 'error' : ''} />
                  {errors.guestFirstName && <span className="error-text">{errors.guestFirstName.message}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input type="text" {...register('guestLastName')} className={errors.guestLastName ? 'error' : ''} />
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
                  <input type="text" {...register('guestPhone')} />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Room Type</label>
            <select {...register('roomTypeId')} className={errors.roomTypeId ? 'error' : ''}>
              <option value="">-- Select Room Type --</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name} (${rt.basePrice}/night)</option>
              ))}
            </select>
            {errors.roomTypeId && <span className="error-text">{errors.roomTypeId.message}</span>}
          </div>
          
          <div className="form-group">
            <label>Corporate Account (Optional)</label>
            <select {...register('companyId')}>
              <option value="">-- No Company --</option>
              {companies.filter(c => c.isActive).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

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
              <label>Adults</label>
              <input type="number" min="1" {...register('adultsCount', { valueAsNumber: true })} className={errors.adultsCount ? 'error' : ''} />
              {errors.adultsCount && <span className="error-text">{errors.adultsCount.message}</span>}
            </div>

            <div className="form-group">
              <label>Children</label>
              <input type="number" min="0" {...register('childrenCount', { valueAsNumber: true })} className={errors.childrenCount ? 'error' : ''} />
              {errors.childrenCount && <span className="error-text">{errors.childrenCount.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Special Requests</label>
            <textarea {...register('specialRequests')} rows={3} placeholder="Late check-in, dietary restrictions..." />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="spinner" size={16} /> : 'Create Reservation'}
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

        .reservation-form {
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

        .checkbox-group label {
          display: flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .checkbox-group input { width: 16px; height: 16px; accent-color: hsl(43, 96%, 56%); }

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

