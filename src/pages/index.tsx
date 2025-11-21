import React, { useEffect, useState } from 'react';
import { defaultProject, SkinProject } from '../lib/schema';
import { loadStoredProject, persistProject } from '../lib/storage';
import { EditorForm } from '../components/EditorForm';
import { PreviewPane } from '../components/PreviewPane';
import { ExportPanel } from '../components/ExportPanel';

export default function HomePage() {
  const [project, setProject] = useState<SkinProject>(() => loadStoredProject(defaultProject));
  const [mobile, setMobile] = useState(true);
  const [dark, setDark] = useState(false);

  useEffect(() => { persistProject(project); }, [project]);

  return (
    <main className="min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">AO3 Work Skin Generator (MVP)</h1>
      <div className="flex gap-4 mb-4 text-sm">
        <label className="flex items-center gap-1"><input type="checkbox" checked={mobile} onChange={e=>setMobile(e.target.checked)} /> Mobile Width</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={dark} onChange={e=>setDark(e.target.checked)} /> Dark Mode Sim</label>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white border rounded p-3 shadow-sm">
          <EditorForm project={project} onChange={setProject} />
        </div>
        <div className="md:col-span-1 bg-white border rounded p-3 shadow-sm">
          <PreviewPane project={project} mobile={mobile} dark={dark} />
        </div>
        <div className="md:col-span-1 bg-white border rounded p-3 shadow-sm">
          <ExportPanel project={project} />
        </div>
      </div>
      <footer className="mt-6 text-center space-y-2">
        <div className="text-xs opacity-70">Feedback welcome. Accessibility-first, media-query-free design for AO3.</div>
        <div className="text-sm">
          <a href="https://ko-fi.com/ao3skingen" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            ☕ Support on Ko-fi
          </a>
        </div>
      </footer>
    </main>
  );
}
