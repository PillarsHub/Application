import React from "react";
import PageHeader from "../../components/pageHeader.jsx";

const Invoices = () => {
  return (
    <PageHeader title="Invoices" preTitle="Account">
      <div className="page-body">
        <div className="container-xl">
          <div className="card">
            <div className="card-body">
              <div className="empty">
                <p className="empty-title">No invoices yet</p>
                <p className="empty-subtitle text-muted">
                  Account invoices will appear here when available.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>
  );
};

export default Invoices;
