import React, { useMemo } from 'react';
import { SkinProject } from '../lib/schema';
import { buildCSS, buildHTML } from '../lib/generator';

interface Props { project: SkinProject; }

function copy(text: string){ navigator.clipboard.writeText(text); }

export const ExportPanel: React.FC<Props> = ({ project }) => {
  const css = useMemo(()=> buildCSS(project), [project]);
  const html = useMemo(()=> buildHTML(project), [project]);
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Export</h2>
      <div className="text-xs opacity-70">Copy CSS into Work Skin editor, HTML into chapter body.</div>
      <div>
        <button onClick={()=>copy(css)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Copy CSS</button>
        <pre className="mt-1 p-2 text-xs bg-gray-800 text-gray-100 overflow-auto max-h-40">{css}</pre>
      </div>
      <div>
        <button onClick={()=>copy(html)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Copy HTML</button>
        <pre className="mt-1 p-2 text-xs bg-gray-800 text-gray-100 overflow-auto max-h-40">{html}</pre>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer font-medium">How to Use</summary>
        <ol className="list-decimal ml-4 space-y-1 mt-2">
          <li>AO3 Dashboard → Skins → Create Work Skin → Paste CSS block.</li>
          <li>Save Skin. Open / edit your work.</li>
          <li>Paste HTML into the chapter text editor (HTML mode).</li>
          <li>Preview on desktop and phone; adjust bubble widths if needed.</li>
        </ol>
      </details>
    </div>
  );
};
