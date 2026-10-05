import { apiClient } from '../lib/apiClient';

export async function fetchSubAdmins() {
  const res = await apiClient('/api/auth/admin/subadmins');
  return res.data || [];
}

export async function createSubAdmin(payload) {
  const res = await apiClient('/api/auth/admin/subadmins', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateSubAdmin(id, payload) {
  const res = await apiClient(`/api/auth/admin/subadmins/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteSubAdmin(id) {
  const res = await apiClient(`/api/auth/admin/subadmins/${id}`, {
    method: 'DELETE',
  });
  return res;
}
