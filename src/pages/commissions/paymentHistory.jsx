import React, { useState } from 'react';
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../hooks/usePost";
import PageHeader from "../../components/pageHeader.jsx";
import DataLoading from "../../components/dataLoading.jsx";
import LocalDate from '../../util/LocalDate.jsx';
import Pagination from '../../components/pagination.jsx';

var GET_DATA = gql`query ($offset: Int!, $first: Int!) {
  batches (offset: $offset, first: $first) {
    created
    id
    count
    amount
    status
  }
  totalBatches
}`

const PaymentHistory = () => {
  const [processing, setProcessing] = useState(false);
  const { loading, error, data, variables, refetch } = useQuery(GET_DATA, {
    variables: { offset: 0, first: 10 },
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const handleProcessBatch = (batchId) => {
    const url = `/api/v1/Batches/${batchId}/process`;
    setProcessing(true);
    SendRequest('POST', url, {}, () => {
      location = '/commissions/paid';
    }, (error) => {
      alert(error);
      setProcessing(false);
    });
  }

  return <PageHeader title="Commissions Paid">
    <div className="container-xl">
      <div className="card">
        <div className="table-responsive">
          <table className="table card-table table-vcenter text-nowrap datatable">
            <thead>
              <tr>
                <th>Batch Id</th>
                <th>Created</th>
                <th>Status</th>
                <th>Released Amount</th>
                <th>Released Count</th>
                <th className="w-1"></th>
              </tr>
            </thead>
            <tbody>
              {data.batches && data.batches.map((batch) => {
                return <tr key={batch.id}  >
                  <td>
                    <a href={`/commissions/paid/${batch.id}`}>Batch {batch.id}</a>
                  </td>
                  <td><LocalDate dateString={batch.created} /></td>
                  <td>
                    {batch.status != "PROCESSED" && batch.status != "CREATED" && <>
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    </>}
                    <span className="text-lowercase text-capitalize">{batch.status.toLowerCase()}</span>
                  </td>
                  <td>{batch.amount.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}</td>
                  <td>{batch.count}</td>
                  <td>
                    {batch.status == "CREATED" && <>
                      {processing && <>
                        <button type="submit" className="btn btn-border-secondary">
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Submit Batch
                        </button>
                      </>}
                      {!processing && <>
                        <button type="submit" className="btn btn-border-secondary" onClick={() => handleProcessBatch(batch.id)}>
                          {/* <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-cash-banknote-move"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M12 18h-7a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4.5" /><path d="M18 12h.01" /><path d="M6 12h.01" /><path d="M16 19h6" /><path d="M19 16l3 3l-3 3" /></svg> */}
                          Submit Batch
                        </button>
                      </>}
                    </>}
                  </td>
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

  </PageHeader >
}

export default PaymentHistory;