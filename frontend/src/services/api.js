import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.startsWith('/auth/');

    if (error.response?.status === 401 && !isAuthRoute) {
      // Session expired — redirect to login (but not during login/register)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('Access denied');
    } else if (error.response?.status === 429) {
      toast.error('Too many attempts. Please wait a moment and try again.');
    } else if (!error.response) {
      toast.error('Network error — is the backend running?');
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const login = (data) => api.post('/auth/login', data);
export const registerStudent = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// --- Student ---
export const getMyProfile = () => api.get('/students/me');
export const lookupStudent = (studentNumber) => api.get(`/students/lookup/${studentNumber}`);
export const updateMyProfile = (data) => api.put('/students/me', data);
export const getMySubjects = () => api.get('/students/me/subjects');
export const getMyStatus = () => api.get('/students/me/status');
export const uploadPhoto = (formData) =>
  api.post('/students/me/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const uploadDocuments = (formData) =>
  api.post('/students/me/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const uploadGrades = (formData) =>
  api.post('/students/me/grades', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const uploadVoucher = (formData) =>
  api.post('/students/me/voucher', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const uploadPsaBirthCert = (formData) =>
  api.post('/students/me/psa-birth-cert', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const uploadTransferCredential = (formData) =>
  api.post('/students/me/transfer-credential', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const uploadGoodMoral = (formData) =>
  api.post('/students/me/good-moral', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const uploadPaymentReceipt = (formData) =>
  api.post('/students/me/payment-receipt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// --- Admin ---
export const getAdminStudents = (params) => api.get('/admin/students', { params });
export const getPendingStudents = (params) => api.get('/admin/students/pending', { params });
export const getStudentById = (id) => api.get(`/admin/students/${id}`);
export const approveStudent = (id, data = {}) => api.put(`/admin/students/${id}/approve`, data);
export const denyStudent = (id) => api.put(`/admin/students/${id}/deny`);
export const deleteStudent = (id) => api.delete(`/admin/students/${id}`);
export const getDashboardStats = () => api.get('/admin/dashboard/stats');
export const getAccounts = (params) => api.get('/admin/accounts', { params });
export const createAccount = (data) => api.post('/admin/accounts', data);
export const deleteAccount = (id) => api.delete(`/admin/accounts/${id}`);
export const resetAccountPassword = (id, data) => api.put(`/admin/accounts/${id}/reset-password`, data);

// --- Registrar ---
export const getApprovedStudents = (params) => api.get('/registrar/students/approved', { params });
export const getClassList = (params) => api.get('/registrar/class-list', { params });
export const getStudentCompleteInfo = (id) => api.get(`/registrar/students/${id}/complete-info`);
export const downloadStudentFiles = (id) =>
  api.get(`/registrar/students/${id}/download-files`, { responseType: 'blob' });
export const getSubjects = (params) => api.get('/registrar/subjects', { params });
export const createSubject = (data) => api.post('/registrar/subjects', data);
export const updateSubject = (id, data) => api.put(`/registrar/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/registrar/subjects/${id}`);
export const assignSubject = (data) => api.post('/registrar/assign-subject', data);
export const unassignSubject = (data) => api.delete('/registrar/unassign-subject', { data });
export const getSubjectStudents = (id) => api.get(`/registrar/subjects/${id}/students`);
export const getStudentEnrolledSubjects = (id) => api.get(`/registrar/students/${id}/enrolled-subjects`);
export const bulkAssignSubjects = (data) => api.post('/registrar/bulk-assign-subjects', data);
export const getPendingPayments = (params) => api.get('/registrar/students/pending-payments', { params });
export const verifyPayment = (id) => api.put(`/registrar/students/${id}/verify-payment`);
export const rejectPayment = (id) => api.put(`/registrar/students/${id}/reject-payment`);
export const updateTransfereeCreditStatus = (id, data) => api.put(`/registrar/students/${id}/transferee-credits`, data);

// --- Notifications ---
export const getNotifications = () => api.get('/notifications');
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllAsRead = () => api.put('/notifications/read-all');

// --- Academic Calendar ---
export const getAcademicCalendar = () => api.get('/admin/academic-calendar');
export const updateAcademicCalendar = (data) => api.put('/admin/academic-calendar', data);
export const getEnrollmentStatus = () => api.get('/utils/enrollment-status');

// --- Utils ---
export const getStrands = () => api.get('/utils/strands');
export const getProvinces = () => api.get('/utils/provinces');
export const getCities = (province) => api.get(`/utils/cities/${province}`);
export const getBarangays = (city) => api.get(`/utils/barangays/${city}`);

export default api;
