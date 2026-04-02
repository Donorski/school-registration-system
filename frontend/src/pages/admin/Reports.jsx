import { useState, useEffect } from 'react';
import { FileText, Download, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { generateEnrollmentReport } from '../../services/api';

export default function Reports() {
  const [schoolYear, setSchoolYear]   = useState('');
  const [semester, setSemester]       = useState('');
  const [generating, setGenerating]   = useState(false);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [previewFilename, setPreviewFilename] = useState('enrollment_report.pdf');

  useEffect(() => {
    return () => { if (previewUrl) window.URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const fetchBlob = async () => {
    const params = {};
    if (schoolYear.trim()) params.school_year = schoolYear.trim();
    if (semester) params.semester = semester;
    const res = await generateEnrollmentReport(params);
    const disposition = res.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'enrollment_report.pdf';
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    return { url, filename };
  };

  const handlePreview = async () => {
    setGenerating(true);
    try {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
      const { url, filename } = await fetchBlob();
      setPreviewUrl(url);
      setPreviewFilename(filename);
    } catch {
      toast.error('Failed to generate preview.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const { url, filename } = await fetchBlob();
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch {
      toast.error('Failed to download report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = previewFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-500">Generate and download enrollment reports as PDF</p>
      </div>

      <div className="max-w-lg bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {/* Icon + title */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-emerald-100 p-3 rounded-xl">
            <FileText size={26} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Enrollment Report</h2>
            <p className="text-sm text-gray-500">Charts, summary stats, and full student list</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              School Year <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 2025-2026"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              disabled={generating}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Semester <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              disabled={generating}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50 disabled:opacity-60"
            >
              <option value="">All Semesters</option>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
            </select>
          </div>
          <p className="text-xs text-gray-400">
            Leave filters blank to include all records across all school years and semesters.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generating ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : <Eye size={15} />}
            Preview
          </button>
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generating ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : <Download size={15} />}
            Download PDF
          </button>
        </div>
      </div>

      {/* PDF Preview overlay */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-emerald-400" />
              <span className="text-sm font-medium">{previewFilename}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadFromPreview}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
              >
                <Download size={15} />
                Download
              </button>
              <button
                onClick={closePreview}
                className="p-1.5 hover:bg-gray-700 rounded-lg transition"
                title="Close preview"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <iframe
            src={previewUrl}
            className="flex-1 w-full border-0"
            title="PDF Preview"
          />
        </div>
      )}
    </DashboardLayout>
  );
}
