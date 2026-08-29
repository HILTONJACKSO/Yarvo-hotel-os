import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  isDanger = false 
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div style={{ marginBottom: '24px', color: 'hsl(210, 40%, 96%)', fontSize: '0.95rem', lineHeight: '1.5' }}>
        {message}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button 
          onClick={onCancel}
          style={{
            background: 'transparent',
            color: 'hsl(215, 20%, 65%)',
            border: '1px solid hsl(217, 20%, 30%)',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'hsl(217, 20%, 16%)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {cancelText}
        </button>
        <button 
          onClick={() => {
            onConfirm();
            onCancel(); // Auto-close on confirm
          }}
          style={{
            background: isDanger ? 'hsl(0, 84%, 60%, 0.15)' : 'hsl(43,96%,56%)',
            color: isDanger ? 'hsl(0, 84%, 65%)' : 'hsl(224, 39%, 6%)',
            border: isDanger ? '1px solid hsl(0, 84%, 60%, 0.3)' : 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            if (isDanger) e.currentTarget.style.background = 'hsl(0, 84%, 60%, 0.25)';
            else e.currentTarget.style.background = 'hsl(43,96%,60%)';
          }}
          onMouseOut={(e) => {
            if (isDanger) e.currentTarget.style.background = 'hsl(0, 84%, 60%, 0.15)';
            else e.currentTarget.style.background = 'hsl(43,96%,56%)';
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

