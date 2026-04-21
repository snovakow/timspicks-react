import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <div className="section-header-center">
        <div className="collapsible-header" aria-expanded={open} aria-controls={title.replace(/\s+/g, '-') + '-content'}>
          <span
            className="section-title"
            onClick={() => setOpen((v) => !v)}
          >
            {title}
            <span className={open ? 'chevron chevron-down' : 'chevron chevron-right'} aria-hidden="true" />
          </span>
        </div>
      </div>
      <div
        id={title.replace(/\s+/g, '-') + '-content'}
        className={`collapsible-content${open ? ' open' : ''}`}
      >
        {children}
      </div>
    </section>
  );
}
