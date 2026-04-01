import React from 'react';
import { Icons } from './Icons';

interface PasswordModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  icon?: 'check' | 'edit';
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  title,
  description,
  icon = 'check',
  onConfirm,
  onCancel,
}) => {
  const [password, setPassword] = React.useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(password);
    setPassword('');
  };

  const IconComponent = icon === 'edit' ? Icons.Edit : Icons.Check;
  const iconBg = icon === 'edit' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="material-panel dark:bg-slate-800 w-full max-w-xs p-8 text-center shadow-2xl">
        <div className={`mx-auto w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mb-6`}>
          <IconComponent className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{description}</p>
        <input
          type="password"
          autoFocus
          placeholder="Palavra-passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          className="material-input w-full px-5 py-4 rounded-xl text-center font-bold text-slate-700 dark:text-white mb-8"
        />
        <div className="flex gap-4">
          <button onClick={() => { onCancel(); setPassword(''); }} className="flex-1 py-3 material-btn text-slate-600 font-bold rounded-xl">
            Cancelar
          </button>
          <button onClick={handleConfirm} className="flex-1 py-3 material-btn-primary font-bold rounded-xl">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
