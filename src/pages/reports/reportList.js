import React from "react";
import PropTypes from 'prop-types';
import { GetScope } from "../../features/authentication/hooks/useToken"
import { useFetch } from "../../hooks/useFetch";
import DataLoading from "../../components/dataLoading";

const ReportList = ({ categoryId, customerId }) => {
  const { loading, error, data } = useFetch(`/api/v1/Reports/?categoryId=${categoryId}`);

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const hasScope = GetScope() != undefined || customerId != undefined;

  return <>
    <div className="table-responsive">
      <table className="table card-table table-vcenter text-nowrap datatable table-ellipsis">
        <thead>
          <tr>
            <th>Name</th>
            <th className="d-none d-sm-table-cell text-start">description</th>
            {!hasScope && <>
              <th className="w-1">Index</th>
              <th className="d-none d-sm-table-cell text-start">Visibility</th>
              <th className="d-none d-sm-table-cell text-start w-1"></th>
            </>}
          </tr>
        </thead>
        <tbody>
          {data && data.map((report) => {
            return <tr key={report.id}>
              <td>
                {customerId && <>
                  <a href={`/customers/${customerId}/reports/${report.id}`} className="text-reset">{report.name}</a>
                </>}
                {!customerId && <>
                  <a href={`/reports/${report.id}`} className="text-reset">{report.name}</a>
                </>}
              </td>
              <td className="text-muted d-none d-sm-table-cell">
                {report.description}
              </td>
              {!hasScope && <>
                <td className="text-muted d-none d-sm-table-cell">
                  {report.displayIndex}
                </td>
                <td className="text-muted d-none d-sm-table-cell">
                  {report.visibility}
                </td>
                <td className="text-muted d-none d-sm-table-cell">
                  {/*  <a className="btn btn-ghost-secondary btn-icon" href={`/reports/${report.id}/edit`} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  </a>
                  <a className="btn btn-ghost-secondary btn-icon" href={`/reports/${report.id}/edit`} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </a> */}
                </td>
              </>}
            </tr>
          })}

        </tbody>
      </table>
    </div>
  </>
}

export default ReportList;

ReportList.propTypes = {
  categoryId: PropTypes.string,
  customerId: PropTypes.string
}