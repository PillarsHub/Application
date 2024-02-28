import React from "react";
import PropTypes from 'prop-types';
import { useFetch } from "../../hooks/useFetch";
import DataLoading from "../../components/dataLoading";

const ReportList = ({ categoryId }) => {
  const { loading, error, data } = useFetch(`/api/v1/Reports/MetaData/${categoryId}`);

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  return <>
    <div className="table-responsive">
      <table className="table table-vcenter card-table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>description</th>
            {/* <th>Author</th>
            <th>Visibility</th> */}
            <th className="w-1"></th>
          </tr>
        </thead>
        <tbody>
          {data && data.map((report) => {
            return <tr key={report.id}>
              <td>
                <a href={`/reports/${report.id}`} className="text-reset">{report.name}</a>
              </td>
              <td className="text-muted">
                {report.description}
              </td>
              {/* <td className="text-muted">
                {report.author}
              </td>
              <td className="text-muted">
                {report.visibility}
              </td> */}
              <td>
                {/* <a href="#">Edit</a> */}
                
              </td>
            </tr>
          })}

        </tbody>
      </table>
    </div>
  </>
}

export default ReportList;

ReportList.propTypes = {
  categoryId: PropTypes.number
}