import React from 'react';
import PropTypes from 'prop-types';
import { useFetch } from '../../../../hooks/useFetch'
import DataLoading from '../../../../components/dataLoading'
import LocalDate from '../../../../util/LocalDate'

const MoneyOutLogs = ({ environmentId }) => {
  const { error, loading, data } = useFetch(`/api/v1/moneyout/${environmentId}/logs`);
  if (error) return `Error! ${error}`;

  if (loading) return <DataLoading />
  if (!data || data.length == 0) return <div className="modal-body">
    <div className="empty">
      <p className="empty-title">No results found</p>
    </div>
  </div>

  return <>
    <table className="table table-vcenter card-table">
      <thead>
        <tr>
          <th className="w-25">Log Time</th>
          <th className="w-1">Count</th>
          <th className="w-1">Code</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {data && data
          .sort((a, b) => new Date(a.logTime) - new Date(b.logTime))
          .map((log) => {
            const truncatedContent = log.message.content?.slice(0, 250);
            return <tr key={log.id}>
              <td><LocalDate dateString={log.logTime} /></td>
              <td>{log.message.paymentsCount}</td>
              <td>{log.message.statusCode}</td>
              <td>
                <code>{log.message.url}</code>
                <br />
                {truncatedContent}
                {log.message.content?.length > 250 && '...'}
              </td>
            </tr>
          })}
      </tbody>
    </table>

  </>
};

export default MoneyOutLogs;

MoneyOutLogs.propTypes = {
  environmentId: PropTypes.string.isRequired
}

