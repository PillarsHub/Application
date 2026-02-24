import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SendRequest } from "../../hooks/usePost.js";
import PageHeader, { CardHeader } from '../../components/pageHeader.jsx';
import { useFetch } from "../../hooks/useFetch.js";
import Modal from "../../components/modal.jsx";
import LocalDate from "../../util/LocalDate.jsx"
import TextInput from "../../components/textInput.jsx";
import ChangePassword from '../../features/authentication/components/changePassword.jsx';
import DataLoading from '../../components/dataLoading.jsx';

const Users = () => {
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [filter, setFilter] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [currentUser, setCurrentUser] = useState({});
  const [error, setError] = useState();
  const { data: userData, loading: userLoading, error: userError, refetch } = useFetch('/api/v1/Users/Find', { search: '', username: true, name: true, scope: false, offset: 0, count: 100 });
  const { data: rolesData, loading: rolesLoading, error: rolesError } = useFetch('/api/v1/roles', {});

  if (userError) return `Error! ${userError}`;
  if (rolesError) return `Error! ${rolesError}`;

  const handleSetFilter = (value) => setFilter(value);
  const handleHideNew = () => setShowNew(false);
  const handleShowNew = () => {
    setCurrentUser({ roleId: 9 })
    setError();
    setShowNew(true);
  }
  const handleHideEdit = () => setShowEdit(false);
  const handleShowEdit = (userId) => {
    var user = userData.find((u) => u.id == userId);
    setCurrentUser(user);
    setShowEdit(true);
  }
  const handleHideChange = () => setShowChange(false);
  const handleShowChange = (userId) => {
    var user = userData.find((u) => u.id == userId);
    setCurrentUser(user);
    setShowChange(true);
  }
  const handleHideDelete = () => setShowDelete(false);
  const handleShowDelete = (userId) => {
    var user = userData.find((u) => u.id == userId);
    setCurrentUser(user);
    setShowDelete(true);
  }

  const handleSearch = e => {
    e.preventDefault();
    refetch({ search: searchText, username: true, name: true, scope: false, offset: 0, count: 100 });
  }

  const handleChange = (name, value) => {
    setCurrentUser((u) => ({ ...u, [name]: value }));
  }

  const handleCreate = () => {
    currentUser.password = generateTemporaryPassword(24);

    SendRequest("POST", "/api/v1/Users", currentUser, (r) => {
      refetch({ search: '', username: true, name: true, scope: false, offset: 0, count: 100 });
      r.success = true;
      r.password = currentUser.password;
      setCurrentUser(r);
    }, (error, code) => {
      if (code == 409) {
        setError("This user already has an account.");
      } else {
        alert(code + ": " + error);
      }
    });
  }

  const handleUpdate = () => {
    SendRequest("PUT", "/api/v1/Users/" + currentUser.id, currentUser, () => {
      refetch({ search: '', username: true, name: true, scope: false, offset: 0, count: 100 });
      setShowEdit(false);
    }, (error) => {
      alert(error);
    });
  }

  const handleDelete = () => {
    SendRequest("DELETE", "/api/v1/Users/" + currentUser.id, currentUser, () => {
      refetch({ search: '', username: true, name: true, scope: false, offset: 0, count: 100 });
      setShowDelete(false);
    }, (error) => {
      alert(error);
    });
  }

  return <PageHeader title="User Management" preTitle="Account">
    <CardHeader>
      <div className="btn-list">
        <Link className="btn btn-default" to="/account/roles">
          Manage Roles
        </Link>
        <button className="btn btn-default" onClick={handleShowNew}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-user-plus" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"></path><path d="M16 19h6"></path><path d="M19 16v6"></path><path d="M6 21v-2a4 4 0 0 1 4 -4h4"></path></svg>
          Add User
        </button>
      </div>
    </CardHeader>
    <div className="page-body">
      <div className="container-xl">
        <div className="card">
          <div className="card-header">
            <div className="row g-2 align-items-center w-100">
              <div className="col">
                <div className="w-100">
                  <form onSubmit={handleSearch} autoComplete="off">
                    <div className="input-icon">
                      <input className="form-control" tabIndex="1" placeholder="Enter search term" onChange={e => setSearchText(e.target.value)} />
                      <span className="input-icon-addon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="10" cy="10" r="7"></circle><line x1="21" y1="21" x2="15" y2="15"></line></svg>
                      </span>
                    </div>
                  </form>
                </div>
              </div>
              <div className="col-auto">
                <select className="form-select" value={filter} onChange={(e) => handleSetFilter(e.target.value)}>
                  <option value="1" >Corporate Users</option>
                  <option value="2">Scoped Users</option>
                  <option value="3">All Users</option>
                </select>
              </div>
            </div>
          </div>
          {userLoading || rolesLoading ? (
            <div className="card-body">
              <DataLoading />
            </div>
          ) : (
            <table className="table table-vcenter table-mobile-md card-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th className="w-1"></th>
                </tr>
              </thead>
              <tbody>
                {userData && userData.map((user) => {
                  if ((user.scope == null && filter == 1) || (user.scope != null && filter == 2) || filter == 3) {
                    return <tr key={user.id}>
                      <td data-label="Name">
                        <div className="d-flex py-1 align-items-center">
                          <span className="avatar avatar-sm me-2">{user.firstName?.charAt().toUpperCase()}{user.lastName?.charAt().toUpperCase()}</span>
                          <div className="flex-fill">
                            <div className="font-weight-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-muted">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td> {rolesData?.find((r) => r.id == user.roleId)?.name} </td>
                      <td> <LocalDate dateString={new Date().toISOString()} /> </td>
                      <td>
                        <div className="btn-list flex-nowrap">
                          <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleShowEdit(user.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                          </button>
                          <div className="dropdown">
                            <button className="btn btn-ghost-secondary btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-menu-2" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 6l16 0"></path><path d="M4 12l16 0"></path><path d="M4 18l16 0"></path></svg>
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">
                              <button className="dropdown-item" onClick={() => handleShowChange(user.id)}>
                                Reset Password
                              </button>
                              <button className="dropdown-item" onClick={() => handleShowDelete(user.id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>

    <Modal showModal={showDelete} size="sm" onHide={handleHideDelete} >
      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      <div className="modal-status bg-danger"></div>
      <div className="modal-body text-center py-4">
        <h3>Are you sure?</h3>
        <div className="text-muted">Do you really want to remove <strong>{currentUser.username}</strong></div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-danger ms-auto" onClick={handleDelete}>
          Delete User
        </button>
      </div>
    </Modal>

    <Modal showModal={showChange} onHide={handleHideChange}>
      <div className="modal-header">
        <h5 className="modal-title">Reset Password</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <label className="form-label required">Email address</label>
          <div>
            <input className="form-control" value={currentUser.username} disabled="true" />
          </div>
        </div>
        <ChangePassword userId={currentUser.id} username={currentUser.username} />
      </div>
    </Modal>

    <Modal showModal={showNew} onHide={handleHideNew}>
      {!currentUser?.success && <><div className="modal-header">
        <h5 className="modal-title">New User</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
        <div className="modal-body">
          <div className="row">
            <div className="col-6 mb-3">
              <label className="form-label">First Name</label>
              <div>
                <TextInput name="firstName" value={currentUser?.firstName ?? ''} onChange={handleChange} />
              </div>
            </div>
            <div className="col-6 mb-3">
              <label className="form-label">Last Name</label>
              <div>
                <TextInput name="lastName" value={currentUser?.lastName ?? ''} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label required">Email address</label>
            <div>
              <TextInput placeholder="Enter email" name="username" value={currentUser?.username ?? ''} onChange={handleChange} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label required">Role</label>
            <div>
              <select className="form-select" name="roleId" value={currentUser.roleId} onChange={(e) => handleChange(e.target.name, e.target.value)}>
                {rolesData && rolesData.map((r) => {
                  return <option key={r.id} value={r.id} >{r.name}</option>
                })}
              </select>
            </div>
          </div>
          <span className="text-danger">{error}</span>
        </div>
      </>}
      {currentUser?.success && <>
        <div className="modal-body py-4">
          <h3 className="mt-3">Congratulations! The user has been successfully created.</h3>
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          <div className="text-muted mb-4">
            To complete the process, please provide the new user with their login credentials. You can either:

            <ul>
              <li>Share their password directly.</li>
              <li>Advise them to navigate to <a href="https://app.pillarshub.com" target='blank'>app.pillarshub.com</a> page to reset their password.</li>
            </ul>
          </div>

          <div className="mb-3">
            <label className="form-label">Email address</label>
            <div>
              <input value={currentUser.username} className="form-control" />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="input-group input-group-flat">
              <input type={currentUser.showPassword ? 'text' : 'password'} className="form-control" value={currentUser?.password} autoComplete="off" />
              <span className="input-group-text">
                <button className="btn-link input-group-link" onClick={() => handleChange('showPassword', true)} >Show password</button>
              </span>
            </div>
          </div>
        </div>
      </>
      }

      <div className="modal-footer">
        {currentUser?.success && <a href="#" className="btn btn-primary" data-bs-dismiss="modal">
          Close
        </a>}
        {!currentUser?.success && <>
          <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
            Cancel
          </a>
          <button type="submit" className="btn btn-primary ms-auto" onClick={handleCreate}>
            Create User
          </button>
        </>}
      </div>
    </Modal>

    <Modal showModal={showEdit} onHide={handleHideEdit}>
      <div className="modal-header">
        <h5 className="modal-title">Edit User</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-6 mb-3">
            <label className="form-label">First Name</label>
            <div>
              <TextInput name="firstName" value={currentUser.firstName} onChange={handleChange} />
            </div>
          </div>
          <div className="col-6 mb-3">
            <label className="form-label">Last Name</label>
            <div>
              <TextInput name="lastName" value={currentUser.lastName} onChange={handleChange} />
            </div>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label required">Email address</label>
          <div>
            <input className="form-control" value={currentUser.username} disabled="true" />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Role</label>
          <div>
            <select className="form-select" name="roleId" value={currentUser.roleId} onChange={(e) => handleChange(e.target.name, e.target.value)}>
              {rolesData && rolesData.map((r) => {
                return <option key={r.id} value={r.id} >{r.name}</option>
              })}
            </select>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-primary ms-auto" onClick={handleUpdate}>
          Save
        </button>
      </div>
    </Modal>

  </PageHeader>
};

function generateTemporaryPassword(length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

export default Users;
