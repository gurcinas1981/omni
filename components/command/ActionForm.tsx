'use client';
import { useActionState } from 'react';
import type { ActionResult } from '@/app/command/actions';

type Action = (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;

export default function ActionForm({
  action,
  submit,
  children,
  className,
  confirm,
  variant = 'btn',
}: {
  action: Action;
  submit: string;
  children?: React.ReactNode;
  className?: string;
  confirm?: string;
  variant?: 'btn' | 'btn btn-ghost' | 'btn btn-ok' | 'btn btn-danger';
}) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form
      action={run}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <div className="row" style={{ marginTop: 6 }}>
        <button className={variant} disabled={pending} type="submit">
          {pending ? 'Working…' : submit}
        </button>
        {state && (
          <span role="status" className={state.ok ? 'small' : 'error'} style={state.ok ? { color: 'var(--ok)' } : undefined}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
