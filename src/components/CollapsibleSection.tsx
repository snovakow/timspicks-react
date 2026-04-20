import React, { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="collapsible-section">
      <button
        className="collapsible-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={title.replace(/\s+/g, '-') + '-content'}
      >
        <span className="collapsible-title">
          {title}
          <span className={open ? 'chevron chevron-down' : 'chevron chevron-right'} aria-hidden="true" />
        </span>
      </button>
      <div
        id={title.replace(/\s+/g, '-') + '-content'}
        className={`collapsible-content${open ? ' open' : ''}`}
      >
        {children}
      </div>
    </section>
  );
}
