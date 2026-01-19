import React from "react";
import PageHeader from "../../components/pageHeader.jsx";
import Avatar from "../../components/avatar.jsx";
import { GetUser } from "../../features/authentication/hooks/useToken.jsx";
import ChangePassword from "../../features/authentication/components/changePassword.jsx";


const Profile = () => {
  let user = GetUser();

  return <PageHeader title="Account" preTitle={`${user.firstName} ${user.lastName}`}>
    <div className="container-xl">
      <div className="row">
        <div className="col-lg-8">
          <div className="row">
            <div className="col">
              <div className="card">
                <div className="row m-3">
                  <div className="col-12 col-sm-auto mb-3">
                    <div className="mx-auto" style={{ width: '80px;' }} >
                      <div className="d-flex justify-content-center align-items-center rounded" style={{ height: '80px', backgroundColor: 'rgb(233, 236, 239)' }}>
                        <Avatar name={`${user.firstName} ${user.lastName}`} size="lg" />
                      </div>
                    </div>
                  </div>
                  <div className="col d-flex flex-column flex-sm-row justify-content-between mb-3">
                    <div className="text-sm-left mb-2 mb-sm-0">
                      <h4 className="pt-sm-2 pb-1 mb-0 text-nowrap">{user.firstName} {user.lastName}</h4>
                      <p className="mb-0">{user.username}</p>
                    </div>
                    <div className="text-center text-sm-right">
                      <span className="badge badge-secondary">{user.roleId}</span>
                    </div>
                  </div>
                </div>

                <div className="card-header">
                  <ul className="nav nav-tabs card-header-tabs" data-bs-toggle="tabs" role="tablist">
                    <li className="nav-item" role="presentation">
                      <a href="#tabs-profile-11" className="nav-link active" data-bs-toggle="tab" aria-selected="false" tabIndex="-1" role="tab">Change Password</a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a href="#tabs-activity-11" className="nav-link" data-bs-toggle="tab" aria-selected="false" tabIndex="-1" role="tab">Personal Data</a>
                    </li>
                  </ul>
                </div>
                <div className="card-body">
                  <div className="tab-content">
                    <div className="tab-pane active show" id="tabs-profile-11" role="tabpanel">
                      <ChangePassword userId={user.userId} username={user.username} />
                    </div>
                    <div className="tab-pane" id="tabs-activity-11" role="tabpanel">
                      <div className="col-md-6">
                        <p>Your account contains personal data that you have given us. This page allows you to {/* download or */} delete that data.</p>
                        <p>
                          <strong>Deleting this data will permanently remove your account, and this cannot be recovered.</strong>
                        </p>
                        <p>
                          <button id="delete" className="btn btn-danger">Delete</button>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageHeader>
}

export default Profile;