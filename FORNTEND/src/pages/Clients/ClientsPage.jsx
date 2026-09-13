import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientApi, projectApi } from '../../api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectIsAdmin } from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Modal from '../../components/common/Modal/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal/ConfirmationModal';
import Pagination from '../../components/common/Pagination/Pagination';
import { Skeleton } from '../../components/common/Skeleton';
import {
  Building2,
  Users,
  Mail,
  Phone,
  User,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  FolderKanban,
  Briefcase,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

const ClientsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAdmin = useAppSelector(selectIsAdmin);

  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cRes, pRes] = await Promise.allSettled([clientApi.getAll(), projectApi.getAll()]);

      if (cRes.status === 'fulfilled') {
        const cData = cRes.value;
        setClients(Array.isArray(cData) ? cData : cData?.data || []);
      }
      if (pRes.status === 'fulfilled') {
        const pData = pRes.value;
        const list = pData?.data?.data || (Array.isArray(pData?.data) ? pData.data : Array.isArray(pData) ? pData : []);
        setProjects(list);
      }
    } catch (err) {
      console.error('Failed to load clients data', err);
      dispatch(addToast({ type: 'error', message: 'Failed to load client directory' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({ name: '', email: '', company: '', phone: '' });
    setFormError('');
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      company: client.company || '',
      phone: client.phone || '',
    });
    setFormError('');
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Agency representative name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Official contact email is required.');
      return;
    }

    try {
      if (isSubmitting) return;
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        company: formData.company.trim(),
        phone: formData.phone.trim(),
      };

      if (modalMode === 'edit' && editingClient) {
        const id = editingClient._id || editingClient.id;
        await clientApi.update(id, payload);
        dispatch(addToast({ type: 'success', message: 'Sponsoring agency updated successfully!' }));
      } else {
        await clientApi.create(payload);
        dispatch(addToast({ type: 'success', message: 'New sponsoring agency registered!' }));
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save client details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = (id, clientName) => {
    setClientToDelete({ id, name: clientName });
  };

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete || deletingClientId) return;
    try {
      setDeletingClientId(clientToDelete.id);
      await clientApi.delete(clientToDelete.id);
      dispatch(addToast({ type: 'info', message: `Agency "${clientToDelete.name}" deleted.` }));
      setClientToDelete(null);
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to delete client agency' }));
    } finally {
      setDeletingClientId(null);
    }
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Paginated clients
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredClients.slice(startIndex, startIndex + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  // Unique companies / ministries
  const uniqueCompanies = Array.from(new Set(clients.map((c) => c.company).filter(Boolean)));

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto w-full">
      {/* Top Header Card with Tricolor Border */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 absolute top-0 left-0" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                National Governance Directory
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Client & Sponsoring Agency Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Central Directory of Sponsoring Ministries, Public Sector Undertakings (PSUs), State Bodies, and Autonomous Development Authorities.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={loadData}
              disabled={isLoading}
              title="Refresh Directory"
            >
              Refresh
            </Button>

            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenCreate}
                className="bg-blue-900 hover:bg-blue-950 text-white cursor-pointer"
              >
                Add Sponsoring Agency
              </Button>
            )}
          </div>
        </div>

        {/* Statistical Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Registered Client Agencies
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {isLoading ? '...' : clients.length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Distinct Sponsoring Bodies
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 mt-1 block">
              {isLoading ? '...' : uniqueCompanies.length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Associated Infrastructure Schemes
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
              {isLoading ? '...' : projects.length}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search agencies by organization, contact person, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
          />
        </div>
      </div>

      {/* Clients Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Building2 size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {searchQuery ? 'No matching agencies found' : 'No sponsoring agencies registered yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Try changing your search query or clear the filter.'
              : 'Add your first government sponsoring agency using the button above.'}
          </p>
          {isAdmin && !searchQuery && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenCreate}
              className="mt-4 bg-blue-900 hover:bg-blue-950 text-white cursor-pointer"
            >
              Add Sponsoring Agency
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedClients.map((client) => {
            const id = client._id || client.id;
            const linkedProjects = projects.filter((p) => {
              const pClientId = typeof p.clientId === 'object' ? p.clientId?._id || p.clientId?.id : p.clientId;
              return pClientId === id;
            });

            return (
              <div
                key={id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between gap-3 group relative"
              >
                <div>
                  {/* Top Agency Branding */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0">
                      <Building2 size={20} />
                    </div>

                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Agency Details"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClient(id, client.name)}
                            disabled={deletingClientId === id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Delete Agency"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Agency Name & Parent Body */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {client.name}
                  </h3>
                  {client.company && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-[11px] border border-blue-200/80 dark:border-blue-900/50">
                      {client.company}
                    </span>
                  )}

                  {/* Contact Info */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <a
                        href={`mailto:${client.email}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate"
                      >
                        {client.email}
                      </a>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <a
                          href={`tel:${client.phone}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate"
                        >
                          {client.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Linked Schemes */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <FolderKanban size={13} className="text-slate-400" />
                    <span>{linkedProjects.length} Schemes Linked</span>
                  </span>

                  {linkedProjects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate(`/projects?client=${id}`)}
                      className="text-blue-600 dark:text-blue-400 font-semibold text-[11px] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View Schemes</span>
                      <ExternalLink size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredClients.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredClients.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[6, 9, 12, 24]}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'edit' ? 'Edit Sponsoring Agency / Client' : 'Register Sponsoring Agency / Client'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Representative / Officer In-Charge Name *"
            icon={User}
            placeholder="e.g. Er. Rajiv Singhania"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Official Contact Email *"
            type="email"
            icon={Mail}
            placeholder="e.g. rajiv.singhania@nhai.gov.in"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Sponsoring Organization / Ministry"
            icon={Building2}
            placeholder="e.g. National Highways Authority of India (NHAI)"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            disabled={isSubmitting}
          />

          <Input
            label="Official Contact Phone"
            icon={Phone}
            placeholder="e.g. +91 11 2507 4100"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
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
              {modalMode === 'edit' ? 'Update Agency' : 'Register Agency'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Client Agency Deletion */}
      <ConfirmationModal
        isOpen={!!clientToDelete}
        onClose={() => !deletingClientId && setClientToDelete(null)}
        onConfirm={handleConfirmDeleteClient}
        title="Delete Sponsoring Agency"
        message="Are you sure you want to remove this sponsoring agency from the registry? Make sure no active schemes are assigned to this agency."
        itemName={clientToDelete?.name}
        confirmText="Delete Agency"
        cancelText="Cancel"
        confirmVariant="danger"
        icon={Trash2}
        isLoading={!!deletingClientId}
      />
    </div>
  );
};

export default ClientsPage;
