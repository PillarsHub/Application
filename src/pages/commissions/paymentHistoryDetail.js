import React, { useState } from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../hooks/usePost";
import PageHeader, { CardHeader } from "../../components/pageHeader";
import DataLoading from "../../components/dataLoading";
import LocalDate from '../../util/LocalDate';
import Avatar from '../../components/avatar';
import Pagination from '../../components/pagination';
import Modal from '../../components/modal';

var GET_DATA = gql`query($batchId: String!) {
  batches (batchIds: [$batchId]) {
    id
    created
    status
    releases {
      id
      amount
      status
      customer
      {
        id
        fullName
        profileImage
      }
      period {
        id
        end
      }
    }
  }
}`

const PaymentHistoryDetail = () => {
  let params = useParams()
  const [processing, setProcessing] = useState(false);
  const [show, setShow] = useState(false);
  const { loading, error, data, variables, refetch } = useQuery(GET_DATA, {
    variables: { batchId: params.batchId },
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const releases = data.batches[0]?.releases || [];

  // Grouping releases by customer.id and period.id
  const groupedReleases = releases.reduce((acc, release) => {
    const key = `${release.customer?.id}-${release.period?.id}`;

    if (!acc[key]) {
      acc[key] = { customer: release.customer, period: release.period, amount: 0, detail: [] };
    }

    acc[key].amount += release.amount;
    acc[key].detail.push(release);

    return acc;
  }, {});

  const handleProcessBatch = () => {
    const batchId = params.batchId;
    const url = `/api/v1/Batches/${batchId}/process`;
    setProcessing(true);
    SendRequest('POST', url, {}, () => {
      location = '/commissions/paid/' + batchId;
    }, (error) => {
      alert(error);
      setProcessing(false);
    });
  }

  const handleHide = () => setShow(false);
  const handleShow = () => setShow(true);

  // Converting the grouped data into an array for rendering
  const groupedReleaseArray = Object.values(groupedReleases);

  return <PageHeader title="Commissions Paid">
    <CardHeader>
      {data.batches?.[0].status == "PROCESSED" && <>
        {processing && <>
          <button className="btn btn-border-secondary">
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            Retry Failed Items
          </button>
        </>}
        {!processing && <>
          <button className="btn btn-border-secondary" onClick={handleShow}>
            Retry Failed Items
          </button>
        </>}
      </>}
    </CardHeader>
    <div className="container-xl">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><span className="me-auto">Batch Detail</span></h3>
          <span className="card-actions btn-actions"><LocalDate dateString={data.batches[0].created} /></span>
        </div>
        <div className="table-responsive">
          <table className="table card-table table-vcenter text-nowrap datatable">
            <thead>
              <tr>
                <th className="w-1"></th>
                <th className="">Customer</th>
                <th className="">Payment Id</th>
                <th className="">Bonus Total</th>
                <th className="">Payments</th>
                <th className="">Period</th>
              </tr>
            </thead>
            <tbody>
              {groupedReleaseArray.map((release) => {
                return <tr key={release?.id}>
                  <td className="text-center">
                    <Avatar name={release.customer?.fullName} url={release.customer?.profileImage} size="sm" />
                  </td>
                  <td>
                    <a className="text-reset" href={`/Customers/${release.customer?.id}/commissions?periodId=${release.period?.id}`}>{release.customer?.fullName}</a>
                    <div className="small text-muted">{release.customer?.id}</div>
                  </td>
                  <td className="">
                    {release.detail.map((s) => {
                      return <div key={s.amount} className="mb-2">
                        <span className="me-3">{s?.id}</span>
                      </div>
                    })}
                    {/* {(release.amount).toLocaleString("en-US", { style: 'currency', currency: 'USD' })} */}
                  </td>
                  <td className="">
                    {release.detail.map((s) => {
                      return <div key={s.amount} className="mb-2">
                        <span className="me-3">{s.amount.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}</span>
                      </div>
                    })}
                    {/* {(release.amount).toLocaleString("en-US", { style: 'currency', currency: 'USD' })} */}
                  </td>
                  <td>
                    {release.detail.map((s) => {
                      return <div key={s.amount} className="mb-2">
                        {s.status == "SUCCESS" && <><span className="badge bg-success me-1"></span> Paid </>}
                        {s.status == "PENDING" && <><span className="badge bg-warning me-1"></span> Pending </>}
                        {s.status == "FAILURE" && <><span className="badge bg-danger me-1"></span> Failed </>}
                      </div>
                    })}
                  </td>
                  <td><LocalDate dateString={release.period.end} hideTime="true" /></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
        <div className="card-footer d-flex align-items-center">
          <Pagination variables={variables} refetch={refetch} total={data.totalBatches} />
        </div>
      </div>
    </div>

    <Modal showModal={show} size="sm" onHide={handleHide} >
      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      <div className="modal-status bg-danger"></div>
      <div className="modal-body text-center py-4">
        <h3>Are you sure?</h3>
        <div className="text-muted">Do you really want to resubmit this batch?</div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-danger ms-auto" onClick={handleProcessBatch}>
          Process Batch
        </button>
      </div>
    </Modal>

  </PageHeader >
}

export default PaymentHistoryDetail;