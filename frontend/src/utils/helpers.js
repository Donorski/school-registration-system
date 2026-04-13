export function getCloudinaryViewUrl(url) {
  if (!url) return url;
  // Return the direct URL — Cloudinary raw PDFs are publicly accessible and
  // browsers can render them natively without a third-party viewer.
  return url;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function statusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    denied: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getErrorMessage(error) {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ');
  }
  return error.message || 'Something went wrong';
}
