/** Billy chat transcript. */

import { useEffect, useRef } from 'react';

import type { BillyMessage } from './billyTypes';

interface Props {
  messages: BillyMessage[];
}

export function BillyMessageList({ messages }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="billy-empty">
        Ask Billy about your draft. Your selection and nearby text are included as
        context.
      </div>
    );
  }

  return (
    <div className="billy-messages">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`billy-msg billy-msg-${m.role}${m.error ? ' is-error' : ''}${m.pending ? ' is-pending' : ''}`}
        >
          {m.content}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
