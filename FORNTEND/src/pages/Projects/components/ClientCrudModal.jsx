import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal/Modal';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import { clientApi } from '../../../api';
import {
  Building2,
  Mail,
  Phone,
  User,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  ArrowLeft,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

/**
 * Client & Sponsoring Agency Management Modal (CRUD)
 */
const ClientCrudModal = ({
  isOpen,
  onClose,
  clients = [],
  onClientsUpdated,
  onSelectClient,
  initialEditClient = null,
  initialMode = 'manage', // 'manage' | 'create' | 'edit'
}) => {
  const [mode, setMode] = useState(initialMode); // 'manage' | 'create' | 'edit'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState(initialEditClient);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (initialEditClient) {
        setEditingClient(initialEditClient);
        setFormData({
          name: initialEditClient.name || '',
          email: initialEditClient.email || '',
          company: initialEditClient.company || '',
          phone: initialEditClient.phone || '',
        });
      } else {
        setFormData({ name: '', email: '', company: '', phone: '' });
      }
      setFormError('');
      setDeleteConfirmId(null);
    }
  }, [isOpen, initialMode, initialEditClient]);

  const handleStartCreate = () => {
    setEditingClient(null);
    setFormData({ name: '', email: '', company: '', phone: '' });
    setFormError('');
    setMode('create');
  };

  const handleStartEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      company: client.company || '',
      phone: client.phone || '',
    });
    setFormError('');
    setMode('edit');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Agency / Representative name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Official contact email is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        company: formData.company.trim(),
        phone: formData.phone.trim(),
      };

      let savedClient = null;
      if (mode === 'edit' && editingClient) {
        const id = editingClient._id || editingClient.id;
        const res = await clientApi.update(id, payload);
        savedClient = res?.data || res || { ...payload, _id: id, id };
      } else {
        const res = await clientApi.create(payload);
        savedClient = res?.data || res;
      }

      if (onClientsUpdated) {
        await onClientsUpdated(savedClient);
      }
      if (onSelectClient && savedClient) {
        onSelectClient(savedClient._id || savedClient.id);
      }
      onClose();
    } catch (err) {
      console.error('Client save error:', err);
      setFormError(err.message || 'Failed to save client details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await clientApi.delete(id);
      if (onClientsUpdated) {
        await onClientsUpdated(null, id);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Client delete error:', err);
      setFormError(err.message || 'Failed to delete client agency.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'manage'
          ? 'Client & Sponsoring Agency Management'
          : mode === 'edit'
          ? 'Edit Sponsoring Agency / Client'
          : 'Register New Sponsoring Agency / Client'
      }
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        {/* Error Banner */}
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* MANAGE MODE: Search & Table */}
        {mode === 'manage' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by agency, person, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleStartCreate}
                className="shrink-0 bg-blue-900 hover:bg-blue-950 text-white cursor-pointer"
              >
                Add New Client
              </Button>
            </div>

            {/* List of Clients */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[360px] overflow-y-auto">
              {filteredClients.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <Building2 size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {searchQuery ? 'No matching agencies found' : 'No clients registered yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click "Add New Client" above to register a sponsoring public department or agency.
                  </p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const id = client._id || client.id;
                  const isDeleting = deleteConfirmId === id;

                  return (
                    <div
                      key={id}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {client.name}
                          </span>
                          {client.company && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[10px] font-semibold border border-blue-200 dark:border-blue-800">
                              {client.company}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail size={12} className="text-slate-400" />
                            {client.email}
                          </span>
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} className="text-slate-400" />
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isDeleting ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-900">
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 px-1">
                              Delete?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteClient(id)}
                              disabled={isSubmitting}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? '...' : 'Yes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={isSubmitting}
                              className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            {onSelectClient && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectClient(id);
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Select this client for project"
                              >
                                <Check size={13} />
                                <span className="hidden sm:inline">Select</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(client)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Client"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete Client"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* CREATE / EDIT FORM */}
        {(mode === 'create' || mode === 'edit') && (
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Official / Contact Person Name *"
                icon={User}
                placeholder="e.g. Er. Rajiv Singhania"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Official Email ID *"
                icon={Mail}
                type="email"
                placeholder="e.g. rajiv.singhania@gov.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Sponsoring Agency / Organization"
                icon={Building2}
                placeholder="e.g. National Highways Authority of India (NHAI)"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                disabled={isSubmitting}
              />

              <Input
                label="Official Phone / Helpline"
                icon={Phone}
                placeholder="e.g. +91 11 2507 4100"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMode('manage')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Agency Directory</span>
              </button>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  className="bg-blue-900 hover:bg-blue-950 text-white cursor-pointer"
                >
                  {mode === 'edit' ? 'Update Client' : 'Create & Select Client'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default ClientCrudModal;
