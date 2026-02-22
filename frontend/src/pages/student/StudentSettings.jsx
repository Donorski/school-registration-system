import { useRef, useState } from 'react';
import { Camera, Trash2, User, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export default function StudentSettings() {
  const { user, avatar, updateAvatar } = useAuth();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(avatar);
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);

  const displayName = user?.display_name || user?.email || '';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images are allowed');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image must be smaller than 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setChanged(true);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected if removed then re-added
    e.target.value = '';
  };

  const handleRemove = () => {
    setPreview(null);
    setChanged(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      updateAvatar(preview); // null clears it
      setChanged(false);
      toast.success('Profile picture updated!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500">Manage your profile picture and account info</p>
      </div>

      <div className="max-w-lg space-y-6">

        {/* Avatar card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-5">Profile Picture</h2>

          <div className="flex flex-col items-center gap-4">
            {/* Avatar preview */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-emerald-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden border-4 border-emerald-100 shadow">
                {preview
                  ? <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
                  : <span>{displayName[0]?.toUpperCase() || '?'}</span>}
              </div>

              {/* Overlay camera icon on hover */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                title="Change photo"
              >
                <Camera size={28} className="text-white" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
              >
                <Camera size={16} />
                {preview ? 'Change Photo' : 'Upload Photo'}
              </button>

              {preview && (
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center">JPG, PNG, or WebP · Max 2 MB</p>
          </div>

          {changed && (
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Account info card (read-only) */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Account Information</h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 text-gray-600">
              <User size={16} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Display Name</p>
                <p className="font-medium text-gray-800">{displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Mail size={16} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Email</p>
                <p className="font-medium text-gray-800">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <ShieldCheck size={16} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Role</p>
                <p className="font-medium text-gray-800 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            To update your name, edit your{' '}
            <a href="/student/profile" className="text-emerald-600 hover:underline">Application Form</a>.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
