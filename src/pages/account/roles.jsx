import React, { useMemo, useState } from 'react';
import { SendRequest } from "../../hooks/usePost.js";
import PageHeader, { CardHeader } from '../../components/pageHeader.jsx';
import { useFetch } from "../../hooks/useFetch.js";
import Modal from "../../components/modal.jsx";
import TextInput from "../../components/textInput.jsx";
import DataLoading from '../../components/dataLoading.jsx';

const PERMISSION_OPTIONS = ['NoAccess', 'ReadOnly', 'WriteOnly', 'ScopeAccess', 'FullAccess'];
const SYSTEM_ROLE_NAMES = new Set(['backoffice', 'full access']);
const PERMISSION_KEYS = [
  'graphQL',
  'customers',
  'batches',
  'bonuses',
  'compensationPlans',
  'nodes',
  'periods',
  'placements',
  'snapshots',
  'sourceGroups',
  'sources',
  'trees',
  'values',
  'autoships',
  'inventory',
  'orders',
  'users',
];

const createDefaultPermissions = () => {
  const permissions = {};
  PERMISSION_KEYS.forEach((key) => {
    permissions[key] = 'NoAccess';
  });

  return permissions;
};

const normalizeRole = (role = {}) => {
  const permissions = createDefaultPermissions();
  Object.assign(permissions, role.permissions ?? {});

  return {
    id: role.id,
    name: role.name ?? '',
    permissions,
  };
};

const isSystemRole = (role = {}) => SYSTEM_ROLE_NAMES.has((role.name ?? '').trim().toLowerCase());

const Roles = () => {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [currentRole, setCurrentRole] = useState(normalizeRole());
  const [error, setError] = useState();
  const { data: rolesData, loading, error: rolesError, refetch } = useFetch('/api/v1/Roles', {});

  const sortedRoles = useMemo(() => {
    if (!rolesData) return [];
    return [...rolesData].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [rolesData]);

  if (rolesError) return `Error! ${rolesError.message ?? rolesError}`;

  const handleHideEdit = () => setShowEdit(false);
  const handleShowCreate = () => {
    setCurrentRole(normalizeRole());
    setError();
    setShowEdit(true);
  };
  const handleShowEdit = (roleId) => {
    const role = sortedRoles.find((r) => r.id == roleId);
    if (!role || isSystemRole(role)) return;
    setCurrentRole(normalizeRole(role));
    setError();
    setShowEdit(true);
  };
  const handleHideDelete = () => setShowDelete(false);
  const handleShowDelete = (roleId) => {
    const role = sortedRoles.find((r) => r.id == roleId);
    if (!role || isSystemRole(role)) return;
    setCurrentRole(normalizeRole(role));
    setError();
    setShowDelete(true);
  };

  const handleChange = (name, value) => {
    setCurrentRole((r) => ({ ...r, [name]: value }));
  };

  const handlePermissionChange = (name, value) => {
    setCurrentRole((r) => ({
      ...r,
      permissions: {
        ...(r.permissions ?? {}),
        [name]: value,
      },
    }));
  };

  const handleSave = () => {
    if (!currentRole.name?.trim()) {
      setError('Role name is required.');
      return;
    }

    const payload = {
      id: currentRole.id,
      name: currentRole.name.trim(),
      permissions: currentRole.permissions,
    };

    const method = currentRole.id ? 'PUT' : 'POST';
    const url = currentRole.id ? `/api/v1/Roles/${currentRole.id}` : '/api/v1/Roles';

    SendRequest(method, url, payload, () => {
      refetch({});
      setShowEdit(false);
    }, (requestError) => {
      setError(requestError || 'Unable to save role.');
    });
  };

  const handleDelete = () => {
    if (!currentRole.id) return;

    SendRequest('DELETE', `/api/v1/Roles/${currentRole.id}`, currentRole, () => {
      refetch({});
      setShowDelete(false);
    }, (requestError) => {
      setError(requestError || 'Unable to delete role.');
    });
  };

  return <PageHeader title="Role Management" preTitle="Account">
    <CardHeader>
      <div className="btn-list">
        <button className="btn btn-primary" onClick={handleShowCreate}>
          Add Role
        </button>
      </div>
    </CardHeader>
    <div className="container-xl">
      <div className="card">
        {loading ? (
          <div className="card-body">
            <DataLoading />
          </div>
        ) : (
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Users Access</th>
                <th className="w-1"></th>
              </tr>
            </thead>
            <tbody>
              {sortedRoles.map((role) => (
                <tr key={role.id}>
                  <td>{role.name}</td>
                  <td>{role.permissions?.users ?? 'NoAccess'}</td>
                  <td>
                    {!isSystemRole(role) && (
                      <div className="btn-list flex-nowrap">
                        <button type="button" className="btn btn-ghost-secondary btn-icon" onClick={() => handleShowEdit(role.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                        </button>
                        <button type="button" className="btn btn-ghost-secondary btn-icon" onClick={() => handleShowDelete(role.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>

    <Modal showModal={showEdit} onHide={handleHideEdit} size="lg" focus={false}>
      <div className="modal-header">
        <h5 className="modal-title">{currentRole.id ? 'Edit Role' : 'New Role'}</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <label className="form-label required">Role Name</label>
          <TextInput name="name" value={currentRole.name ?? ''} onChange={handleChange} />
        </div>

        <div className="table-responsive">
          <table className="table table-sm table-vcenter">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_KEYS.map((key) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    <select
                      className="form-select"
                      value={currentRole.permissions?.[key] ?? 'NoAccess'}
                      onChange={(e) => handlePermissionChange(key, e.target.value)}
                    >
                      {PERMISSION_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <span className="text-danger">{error}</span>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-primary ms-auto" onClick={handleSave}>
          Save
        </button>
      </div>
    </Modal>

    <Modal showModal={showDelete} size="sm" onHide={handleHideDelete}>
      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      <div className="modal-status bg-danger"></div>
      <div className="modal-body text-center py-4">
        <h3>Are you sure?</h3>
        <div className="text-muted">Do you really want to delete <strong>{currentRole.name}</strong>?</div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-danger ms-auto" onClick={handleDelete}>
          Delete Role
        </button>
      </div>
    </Modal>
  </PageHeader>;
};

export default Roles;
