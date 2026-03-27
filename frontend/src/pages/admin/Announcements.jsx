import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, Pin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../../services/api';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [pinned, setPinned] = useState(false);
  const [expiry, setExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAnnouncements().then((res) => setAnnouncements(res.data)).catch(() => {});
  }, []);

  const handlePost = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSaving(true);
    try {
      const res = await createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        is_pinned: pinned,
        expires_at: expiry || null,
      });
      setAnnouncements((prev) => [res.data, ...prev].sort((a, b) => b.is_pinned - a.is_pinned));
      setTitle(''); setMessage(''); setPinned(false); setExpiry('');
      setModalOpen(false);
      toast.success('Announcement posted');
    } catch {
      toast.error('Failed to post announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success('Announcement deleted');
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
          <p className="text-gray-500 text-sm mt-0.5">Post updates visible to all students on their dashboard</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
        >
          <Plus size={15} />
          New Announcement
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm text-center py-16">
          <Megaphone size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">No announcements yet</p>
          <p className="text-sm text-gray-400 mt-1">Students will see announcements on their dashboard.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`flex items-start justify-between gap-4 p-4 rounded-xl border shadow-sm ${
                ann.is_pinned ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {ann.is_pinned && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      <Pin size={10} /> Pinned
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-800 text-sm">{ann.title}</h3>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line">{ann.message}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{new Date(ann.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  {ann.expires_at && (
                    <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full font-medium">
                      Expires {new Date(ann.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(ann.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Announcement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm animate-backdrop-enter">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-enter">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Megaphone size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">New Announcement</h2>
                    <p className="text-xs text-emerald-100">Visible to all students on their dashboard</p>
                  </div>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Enrollment is now open"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Write your announcement here..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50"
                  />
                  <p className="text-xs text-gray-400 mt-1">Announcement auto-hides after this date.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Pin this announcement</p>
                    <p className="text-xs text-amber-600">Pinned announcements always appear at the top</p>
                  </div>
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                <button
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePost}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition disabled:opacity-60"
                >
                  <Megaphone size={15} />
                  {saving ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
