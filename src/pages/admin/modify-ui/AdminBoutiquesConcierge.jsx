import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Phone,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Star,
  Check,
  X
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { AdminPageHeader } from '../../../components/admin/AdminPageHeader';
import { useModalScrollLock } from '../../../hooks/useModalScrollLock';

export const AdminBoutiquesConcierge = () => {
  const [activeTab, setActiveTab] = useState('concierge'); // 'concierge' | 'boutiques'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingConcierge, setSavingConcierge] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [toast, setToast] = useState(null);

  // Concierge Form State
  const [conciergeData, setConciergeData] = useState({
    section_badge: 'CLIENT SERVICES',
    section_title: 'ATELIER CONCIERGE',
    email: 'houseofurvaah@gmail.com',
    phone: '+91 98333 25657',
    hours: 'Monday – Saturday: 10:00 AM – 8:00 PM IST'
  });

  // Boutiques Header State
  const [boutiquesHeader, setBoutiquesHeader] = useState({
    section_badge: 'FLAGSHIP BOUTIQUES',
    section_title: 'ATELIER LOCATIONS'
  });

  // Boutique Locations List
  const [locations, setLocations] = useState([]);

  // Modal States for Add / Edit Boutique
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    phone: '',
    is_primary: false,
    is_active: true
  });

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lock background scroll when location modal or delete confirmation is active
  useModalScrollLock(Boolean(isLocationModalOpen || deleteTarget), () => {
    if (isLocationModalOpen) setIsLocationModalOpen(false);
    if (deleteTarget) setDeleteTarget(null);
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3800);
  };

  const fetchContactData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiClient('/api/ui/admin/contact-info');
      if (res && res.success && res.data) {
        if (res.data.concierge) {
          setConciergeData({
            section_badge: res.data.concierge.section_badge || 'CLIENT SERVICES',
            section_title: res.data.concierge.section_title || 'ATELIER CONCIERGE',
            email: res.data.concierge.email || '',
            phone: res.data.concierge.phone || '',
            hours: res.data.concierge.hours || ''
          });
        }
        if (res.data.boutiques) {
          setBoutiquesHeader({
            section_badge: res.data.boutiques.section_badge || 'FLAGSHIP BOUTIQUES',
            section_title: res.data.boutiques.section_title || 'ATELIER LOCATIONS'
          });
          setLocations(res.data.boutiques.locations || []);
        }
      }
    } catch (err) {
      console.error('Failed to load contact info:', err);
      showToast('error', err.message || 'Failed to load details from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContactData();
  }, []);

  // Save Concierge Details
  const handleSaveConcierge = async (e) => {
    e.preventDefault();
    setSavingConcierge(true);
    try {
      const res = await apiClient('/api/ui/admin/contact-info/concierge', {
        method: 'PUT',
        body: JSON.stringify(conciergeData)
      });
      if (res && res.success) {
        showToast('success', 'Atelier Concierge details updated successfully!');
      } else {
        throw new Error(res?.message || 'Failed to save concierge details');
      }
    } catch (err) {
      console.error('Error saving concierge:', err);
      showToast('error', err.message || 'Could not save concierge details');
    } finally {
      setSavingConcierge(false);
    }
  };

  // Save Boutiques Section Header
  const handleSaveBoutiquesHeader = async (e) => {
    e.preventDefault();
    setSavingHeader(true);
    try {
      const res = await apiClient('/api/ui/admin/contact-info/boutiques-header', {
        method: 'PUT',
        body: JSON.stringify(boutiquesHeader)
      });
      if (res && res.success) {
        showToast('success', 'Boutique locations section header updated!');
      } else {
        throw new Error(res?.message || 'Failed to update section header');
      }
    } catch (err) {
      console.error('Error saving boutique header:', err);
      showToast('error', err.message || 'Could not update section header');
    } finally {
      setSavingHeader(false);
    }
  };

  // Open Modal to Create Location
  const openCreateModal = () => {
    setEditingLocation(null);
    setLocationForm({
      name: '',
      address: '',
      phone: '',
      is_primary: locations.length === 0,
      is_active: true
    });
    setIsLocationModalOpen(true);
  };

  // Open Modal to Edit Location
  const openEditModal = (loc) => {
    setEditingLocation(loc);
    setLocationForm({
      name: loc.name || '',
      address: loc.address || '',
      phone: loc.phone || '',
      is_primary: Boolean(loc.is_primary),
      is_active: loc.is_active !== undefined ? Boolean(loc.is_active) : true
    });
    setIsLocationModalOpen(true);
  };

  // Save Location (Create or Update)
  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (!locationForm.name.trim()) {
      showToast('error', 'Location name is required');
      return;
    }
    if (!locationForm.address.trim()) {
      showToast('error', 'Location address is required');
      return;
    }

    setSavingLocation(true);
    try {
      if (editingLocation) {
        // Update
        const res = await apiClient(`/api/ui/admin/contact-info/locations/${editingLocation.id}`, {
          method: 'PUT',
          body: JSON.stringify(locationForm)
        });
        if (res && res.success) {
          showToast('success', `Boutique "${locationForm.name}" updated successfully!`);
          setIsLocationModalOpen(false);
          await fetchContactData(true);
        } else {
          throw new Error(res?.message || 'Failed to update boutique');
        }
      } else {
        // Create
        const res = await apiClient('/api/ui/admin/contact-info/locations', {
          method: 'POST',
          body: JSON.stringify(locationForm)
        });
        if (res && res.success) {
          showToast('success', `New boutique location added successfully!`);
          setIsLocationModalOpen(false);
          await fetchContactData(true);
        } else {
          throw new Error(res?.message || 'Failed to create boutique location');
        }
      }
    } catch (err) {
      console.error('Error saving boutique location:', err);
      showToast('error', err.message || 'Could not save location');
    } finally {
      setSavingLocation(false);
    }
  };

  // Set Location as Primary
  const handleSetPrimary = async (loc) => {
    try {
      const res = await apiClient(`/api/ui/admin/contact-info/locations/${loc.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_primary: true })
      });
      if (res && res.success) {
        showToast('success', `"${loc.name}" set as Primary Flagship for Footer.`);
        await fetchContactData(true);
      }
    } catch (err) {
      showToast('error', 'Could not set primary flagship');
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (loc) => {
    try {
      const nextStatus = !loc.is_active;
      const res = await apiClient(`/api/ui/admin/contact-info/locations/${loc.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: nextStatus })
      });
      if (res && res.success) {
        showToast('success', `"${loc.name}" is now ${nextStatus ? 'Active' : 'Hidden'}.`);
        await fetchContactData(true);
      }
    } catch (err) {
      showToast('error', 'Could not update status');
    }
  };

  // Reorder Locations (Move Up/Down)
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= locations.length) return;

    const newLocs = [...locations];
    const temp = newLocs[index];
    newLocs[index] = newLocs[targetIndex];
    newLocs[targetIndex] = temp;

    // Build payload with new order indexes
    const ordersPayload = newLocs.map((loc, idx) => ({
      id: loc.id,
      display_order: idx + 1
    }));

    setLocations(newLocs);

    try {
      await apiClient('/api/ui/admin/contact-info/locations/reorder', {
        method: 'PUT',
        body: JSON.stringify({ orders: ordersPayload })
      });
      showToast('success', 'Boutique order saved');
    } catch (err) {
      showToast('error', 'Failed to save reorder');
      await fetchContactData(true);
    }
  };

  // Delete Location
  const handleDeleteLocation = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await apiClient(`/api/ui/admin/contact-info/locations/${deleteTarget.id}`, {
        method: 'DELETE'
      });
      if (res && res.success) {
        showToast('success', `Boutique "${deleteTarget.name}" deleted.`);
        setDeleteTarget(null);
        await fetchContactData(true);
      } else {
        throw new Error(res?.message || 'Failed to delete');
      }
    } catch (err) {
      showToast('error', err.message || 'Could not delete boutique location');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3.5 px-5 py-4 rounded-xl shadow-2xl text-sm font-sans border bg-neutral-950 text-white transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 min-w-[340px] max-w-[480px] ${
            toast.type === 'success' ? 'border-emerald-500/40 shadow-emerald-950/20' : 'border-rose-500/40 shadow-rose-950/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 stroke-[2.2]" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 stroke-[2.2]" />
          )}
          <span className="font-semibold tracking-wide text-xs sm:text-sm text-white leading-snug">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <AdminPageHeader
        title="Boutiques & Atelier Concierge"
        subtitle="Manage client services contact channels and flagship atelier boutique locations dynamically."
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchContactData(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <a
            href="/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-dark rounded-lg hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Live Page</span>
          </a>
        </div>
      </AdminPageHeader>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveTab('concierge')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold tracking-wider uppercase border-b-2 transition-colors cursor-pointer ${
            activeTab === 'concierge'
              ? 'border-brand-dark text-brand-dark font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Atelier Concierge & Support</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('boutiques')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold tracking-wider uppercase border-b-2 transition-colors cursor-pointer ${
            activeTab === 'boutiques'
              ? 'border-brand-dark text-brand-dark font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Flagship Boutiques ({locations.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center bg-white border border-neutral-200/80 rounded-2xl shadow-2xs">
          <Loader2 className="w-8 h-8 text-neutral-600 animate-spin mx-auto mb-3" />
          <p className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Loading Boutique & Concierge Configurations...</p>
        </div>
      ) : activeTab === 'concierge' ? (
        /* TAB 1: CONCIERGE & CLIENT SERVICES */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-7 bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-neutral-500 block">
                CLIENT SERVICES CONFIGURATION
              </span>
              <h3 className="text-lg font-serif font-bold tracking-wide uppercase text-brand-dark mt-1">
                Atelier Concierge Channels
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Configure official email, hotline, and operating hours shown to clients on the Contact Us page.
              </p>
            </div>

            <form onSubmit={handleSaveConcierge} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Section Sub-Badge
                  </label>
                  <input
                    type="text"
                    value={conciergeData.section_badge}
                    onChange={(e) => setConciergeData({ ...conciergeData, section_badge: e.target.value })}
                    placeholder="e.g. CLIENT SERVICES"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={conciergeData.section_title}
                    onChange={(e) => setConciergeData({ ...conciergeData, section_title: e.target.value })}
                    placeholder="e.g. ATELIER CONCIERGE"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Email Concierge</span>
                </label>
                <input
                  type="email"
                  required
                  value={conciergeData.email}
                  onChange={(e) => setConciergeData({ ...conciergeData, email: e.target.value })}
                  placeholder="e.g. houseofurvaah@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Direct Hotline / Phone</span>
                </label>
                <input
                  type="text"
                  required
                  value={conciergeData.phone}
                  onChange={(e) => setConciergeData({ ...conciergeData, phone: e.target.value })}
                  placeholder="e.g. +91 98333 25657"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Concierge Working Hours</span>
                </label>
                <input
                  type="text"
                  required
                  value={conciergeData.hours}
                  onChange={(e) => setConciergeData({ ...conciergeData, hours: e.target.value })}
                  placeholder="e.g. Monday – Saturday: 10:00 AM – 8:00 PM IST"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingConcierge}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-dark text-white text-xs font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingConcierge ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Concierge Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
                LIVE STOREFRONT PREVIEW
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Interactive Preview
              </span>
            </div>

            <div className="bg-neutral-50 p-7 border border-neutral-200/90 rounded-sm shadow-xs space-y-6 font-serif">
              <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-800 font-semibold block">
                {conciergeData.section_badge || 'CLIENT SERVICES'}
              </span>
              <h3 className="text-xl font-serif tracking-[0.15em] uppercase text-[#111111]">
                {conciergeData.section_title || 'ATELIER CONCIERGE'}
              </h3>

              <div className="space-y-4 text-xs font-serif text-neutral-800 font-normal">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-neutral-800 mt-0.5 shrink-0 stroke-[1.75]" />
                  <div>
                    <span className="block font-semibold uppercase text-neutral-900 tracking-wider">EMAIL CONCIERGE</span>
                    <a href={`mailto:${conciergeData.email}`} className="hover:underline text-neutral-800 font-medium block mt-0.5">
                      {conciergeData.email || 'houseofurvaah@gmail.com'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-neutral-800 mt-0.5 shrink-0 stroke-[1.75]" />
                  <div>
                    <span className="block font-semibold uppercase text-neutral-900 tracking-wider">DIRECT HOTLINE</span>
                    <a href={`tel:${conciergeData.phone}`} className="hover:underline text-neutral-800 font-medium block mt-0.5">
                      {conciergeData.phone || '+91 98333 25657'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-neutral-800 mt-0.5 shrink-0 stroke-[1.75]" />
                  <div>
                    <span className="block font-semibold uppercase text-neutral-900 tracking-wider">CONCIERGE HOURS</span>
                    <span className="block text-neutral-800 font-medium mt-0.5">
                      {conciergeData.hours || 'Monday – Saturday: 10:00 AM – 8:00 PM IST'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
              Updates to email, hotline, and operating hours take effect in real-time across the client Contact Us portal and customer service touchpoints.
            </p>
          </div>
        </div>
      ) : (
        /* TAB 2: FLAGSHIP BOUTIQUES & ATELIER LOCATIONS */
        <div className="space-y-8">
          {/* Section Headers Card */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-2xs">
            <form onSubmit={handleSaveBoutiquesHeader} className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Section Sub-Badge
                  </label>
                  <input
                    type="text"
                    value={boutiquesHeader.section_badge}
                    onChange={(e) => setBoutiquesHeader({ ...boutiquesHeader, section_badge: e.target.value })}
                    placeholder="e.g. FLAGSHIP BOUTIQUES"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={boutiquesHeader.section_title}
                    onChange={(e) => setBoutiquesHeader({ ...boutiquesHeader, section_title: e.target.value })}
                    placeholder="e.g. ATELIER LOCATIONS"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingHeader}
                className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-brand-dark rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                {savingHeader ? 'Saving...' : 'Save Titles'}
              </button>
            </form>
          </div>

          {/* Locations Header & Add Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold uppercase tracking-wider text-brand-dark">
                Atelier Boutiques ({locations.length})
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Manage each atelier address, phone number, and designate the primary flagship featured in the footer.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-dark text-white rounded-lg text-xs font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Boutique Location</span>
            </button>
          </div>

          {/* Locations Grid & Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* List */}
            <div className="lg:col-span-7 space-y-4">
              {locations.length === 0 ? (
                <div className="py-16 text-center bg-white border border-dashed border-neutral-300 rounded-2xl p-6">
                  <MapPin className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs uppercase tracking-wider text-neutral-600 font-semibold">No boutique locations created yet</p>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-3 text-xs text-brand-dark underline font-bold uppercase tracking-widest cursor-pointer"
                  >
                    + Add your first boutique location
                  </button>
                </div>
              ) : (
                locations.map((loc, idx) => (
                  <div
                    key={loc.id}
                    className={`bg-white border rounded-xl p-5 shadow-2xs transition-all ${
                      loc.is_primary ? 'border-amber-300/80 bg-amber-50/20 ring-1 ring-amber-300/40' : 'border-neutral-200/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-serif font-bold uppercase tracking-wider text-brand-dark">
                            {loc.name}
                          </h4>
                          {loc.is_primary && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Primary Flagship (Footer)</span>
                            </span>
                          )}
                          {!loc.is_active && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-neutral-100 text-neutral-500">
                              Hidden (Inactive)
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-neutral-700 leading-relaxed font-sans whitespace-pre-line">
                          {loc.address ? loc.address
                            .replace('Eastern winds, 1402, E wing, Kurla East', 'Eastern winds, 1402, E wing,\nKurla East')
                            .replace('Kala Ghoda Arts District, Colaba Causeway', 'Kala Ghoda Arts District,\nColaba Causeway') : ''}
                        </p>

                        {loc.phone && (
                          <p className="text-xs font-semibold text-neutral-800 tracking-wide font-sans flex items-center gap-1.5 pt-0.5">
                            <Phone className="w-3 h-3 text-neutral-500" />
                            <span>{loc.phone}</span>
                          </p>
                        )}
                      </div>

                      {/* Ordering & Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex flex-col mr-1">
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, 'down')}
                            disabled={idx === locations.length - 1}
                            className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {!loc.is_primary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(loc)}
                            className="px-2.5 py-1.5 text-[11px] font-semibold text-neutral-600 bg-neutral-100 hover:bg-amber-100 hover:text-amber-900 rounded-lg transition-colors cursor-pointer"
                            title="Feature this as primary flagship in Footer"
                          >
                            Make Primary
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleActive(loc)}
                          className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                            loc.is_active ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          {loc.is_active ? 'Active' : 'Show'}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(loc)}
                          className="p-2 text-neutral-500 hover:text-brand-dark hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Boutique"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(loc)}
                          className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Boutique"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Live Preview on Storefront */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
                  STOREFRONT LIVE PREVIEW
                </span>
                <span className="text-[10px] text-brand-dark font-semibold bg-neutral-100 border border-neutral-300 px-2.5 py-0.5 rounded-full">
                  Contact Us Layout
                </span>
              </div>

              <div className="bg-white p-7 border border-neutral-200/90 rounded-sm shadow-xs space-y-6 font-serif">
                <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-800 font-semibold block">
                  {boutiquesHeader.section_badge || 'FLAGSHIP BOUTIQUES'}
                </span>
                <h3 className="text-xl font-serif tracking-[0.15em] uppercase text-[#111111]">
                  {boutiquesHeader.section_title || 'ATELIER LOCATIONS'}
                </h3>

                <div className="space-y-6 text-xs font-serif font-normal text-neutral-800 border-l-2 border-neutral-400 pl-4">
                  {locations.filter(l => l.is_active).map((loc) => (
                    <div key={`preview-${loc.id}`}>
                      <h4 className="font-semibold uppercase text-neutral-900 tracking-wider text-sm mb-1">
                        {loc.name}
                      </h4>
                      <p className="leading-relaxed text-neutral-800 whitespace-pre-line">
                        {loc.address ? loc.address
                          .replace('Eastern winds, 1402, E wing, Kurla East', 'Eastern winds, 1402, E wing,\nKurla East')
                          .replace('Kala Ghoda Arts District, Colaba Causeway', 'Kala Ghoda Arts District,\nColaba Causeway') : ''}
                      </p>
                      {loc.phone && (
                        <span className="text-neutral-700 font-medium block mt-1">{loc.phone}</span>
                      )}
                    </div>
                  ))}
                  {locations.filter(l => l.is_active).length === 0 && (
                    <p className="text-xs text-neutral-400 italic">No active locations currently visible.</p>
                  )}
                </div>
              </div>

              {/* Footer Preview Callout */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-xs text-neutral-600 font-sans space-y-1">
                <span className="font-bold text-neutral-900 uppercase tracking-wider text-[10px] block">
                  Global Footer Sync:
                </span>
                <p>
                  The location marked with <strong>Primary Flagship (Footer)</strong> will automatically appear in the footer under "VISIT US".
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT BOUTIQUE MODAL */}
      {isLocationModalOpen && (
        <div
          onClick={() => setIsLocationModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain overflow-y-auto animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 custom-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-serif font-bold uppercase tracking-wider text-brand-dark">
                {editingLocation ? 'Edit Atelier Boutique' : 'Add New Atelier Boutique'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Boutique / Atelier Title *
                </label>
                <input
                  type="text"
                  required
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="e.g. MUMBAI FLAGSHIP & STYLING SALON"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Full Street & District Address *
                </label>
                <textarea
                  required
                  rows={3}
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  placeholder={"e.g. Eastern winds, 1402, E wing,\nKurla East, Mumbai 400070"}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Direct Boutique Phone / Hotline
                </label>
                <input
                  type="text"
                  value={locationForm.phone}
                  onChange={(e) => setLocationForm({ ...locationForm, phone: e.target.value })}
                  placeholder="e.g. +91 98333 25657"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>

              <div className="pt-2 space-y-2 border-t border-neutral-100">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={locationForm.is_primary}
                    onChange={(e) => setLocationForm({ ...locationForm, is_primary: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-dark focus:ring-brand-dark cursor-pointer"
                  />
                  <span>Designate as Primary Flagship (Featured in Footer)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={locationForm.is_active}
                    onChange={(e) => setLocationForm({ ...locationForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-dark focus:ring-brand-dark cursor-pointer"
                  />
                  <span>Active & Visible on Storefront</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2.5 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-dark text-white rounded-lg text-xs font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingLocation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingLocation ? 'Save Changes' : 'Create Location'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain overflow-y-auto animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95 custom-scrollbar"
          >
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-serif font-bold uppercase tracking-wider text-brand-dark">
                Delete Boutique Location?
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Are you sure you want to permanently remove <strong>{deleteTarget.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLocation}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-lg text-xs font-semibold tracking-wider uppercase hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Location</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
