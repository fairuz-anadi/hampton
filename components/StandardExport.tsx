'use client';

import { useState } from 'react';

/** The approved guide, as something you can take away. A marking standard that
 *  only exists inside one web page is not a standard you can reuse next
 *  semester, and reuse is the entire point of keeping it. */
export default function StandardExport({ json, filename }: { json: string; filename: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setState('copied');
    } catch {
      setState('failed');
    }
    setTimeout(() => setState('idle'), 2400);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="row">
      <button className="btn" onClick={copy}>
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Could not copy — use download' : 'Copy the standard'}
      </button>
      <button className="btn btn-ghost" onClick={download}>
        Download as JSON
      </button>
    </div>
  );
}
