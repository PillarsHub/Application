import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"
import { useFetch, Get } from "../../hooks/useFetch";
import { GetToken, GetScope } from '../../features/authentication/hooks/useToken';
import BaseUrl from "../../hooks/baseUrl";
import PageHeader, { CardHeader } from "../../components/pageHeader";
import DataLoading from "../../components/dataLoading";
import Pagination from "../../components/pagination";
import DataError from "../../components/dataError";
import LocalDate from "../../util/LocalDate";
import FilterInput from "./filterInput";
import Avatar from "../../components/avatar";

const notLoading = 0;
const loadingPage = 1;
const loadingMore = 2;

const Report = () => {
  let params = useParams()
  const [values, setValues] = useState({ offset: 0, count: 15 });
  const [data, setData] = useState();
  const [downloadLink, setDownloadLink] = useState();
  const [dataLoading, setDataLoading] = useState(notLoading);
  const [dataError, setDataError] = useState();
  const { loading: metaLoading, error: metaError, data: meta } = useFetch(`/api/v1/Reports/${params.reportId}`);

  useEffect(() => {
    if (meta) {
      const scope = GetScope() ?? params.customerId;
      const customerFilter = meta.filters.find(filter => filter.inputType === 'CustomerId');

      if (customerFilter && scope) {
        setValues(v => ({ ...v, customerId: scope }));
      }
    }
  }, [meta])

  useEffect(() => {
    if (meta) {
      if (meta.filters.every(item => Object.prototype.hasOwnProperty.call(values, item.id) && values[item.id])) {
        setDataLoading((values?.filterUpdate ?? true) ? loadingPage : loadingMore);
        setDataError();

        const objString = values ? '?' + Object.entries(values).map(([key, value]) => {
          if (Array.isArray(value)) {
            // If the value is an array, repeat the parameter for each element
            return value.map((element) => `${key}=${encodeURIComponent(element)}`).join('&');
          } else {
            // If the value is not an array, just include the parameter once
            return `${key}=${encodeURIComponent(value)}`;
          }
        }).join('&') : '';

        setDownloadLink(`${BaseUrl}/api/v1/reports/${params.reportId}/csv${objString}&authorization=${GetToken().token}`);

        Get(`/api/v1/Reports/${params.reportId}/json${objString}`, (r) => {
          setDataLoading(notLoading);
          if (r.totalRows == -1 && !values.filterUpdate) {
            setData(c => ({
              ...r,
              dataRows: [...(c?.dataRows || []), ...r.dataRows]
            }));
          } else {
            setData(r);
          }

        }, (error) => {
          setDataLoading(notLoading);
          setDataError(error);
        })
      }
    }
  }, [values, meta]);

  if (metaError) return <DataError error={metaError} />
  if (metaLoading) return <DataLoading />

  const handlePageChange = (page) => {
    setValues(v => ({ ...v, offset: page.offset, filterUpdate: false }));
  }

  const handleChange = (name, value) => {
    setValues((v) => ({ ...v, [name]: value, filterUpdate: true }));
  }

  var showPaging = (data?.totalRows ?? 1) > 0;
  var crumbUrl = `/reports`;
  if (params.customerId) crumbUrl = `/customers/${params.customerId}/reports`;

  return <PageHeader title={meta.name} breadcrumbs={[{ title: 'Reports', link: crumbUrl }, { title: meta.categoryName, link: `${crumbUrl}#${meta.categoryId}` }]} customerId={params.customerId}>
    <CardHeader>
      <div className="btn-list">
        {downloadLink && <a className="btn btn-default btn-sm-icon" href={downloadLink} target="_blank" rel="noreferrer">
          {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-file-type-csv"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M7 16.5a1.5 1.5 0 0 0 -3 0v3a1.5 1.5 0 0 0 3 0" /><path d="M10 20.25c0 .414 .336 .75 .75 .75h1.25a1 1 0 0 0 1 -1v-1a1 1 0 0 0 -1 -1h-1a1 1 0 0 1 -1 -1v-1a1 1 0 0 1 1 -1h1.25a.75 .75 0 0 1 .75 .75" /><path d="M16 15l2 6l2 -6" /></svg> */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
          <span className="d-none d-sm-block text-start">Download</span>
        </a>}
        {!downloadLink && <a className="btn btn-default btn-sm-icon disabled">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
          <span className="d-none d-sm-block text-start">Download</span>
        </a>}
        {/* {!hasScope && <>
          <a className="btn btn-defaul btn-icon" href={`/reports/${params.reportId}/edit`} >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
          </a>
        </>} */}
      </div>
    </CardHeader>
    <div className="page-body">
      <div className="container-xl">
        <div className="card">
          {meta.filters && meta.filters.length > 0 && <>
            <div className="p-3">
              <div className="row">
                {meta.filters && meta.filters.map((filter) => {
                  return <FilterInput key={filter.id} col="col-md-2 col-sm-12 mb-2" filter={filter} values={values} onChange={handleChange} />
                })}
              </div>
            </div>
          </>}

          {dataLoading == loadingPage && <DataLoading title="Generating Report Data" />}
          {dataError && <DataError error={dataError} />}

          {!dataLoading && !dataError && (!data || data.dataRows.length == 0) && <>
            <div className="empty">
              <p className="empty-title">No Data Found</p>
              <p className="empty-subtitle text-muted">
                There was not data found for the current report.
              </p>
            </div>
          </>}

          {(dataLoading != loadingPage) && data && (data?.totalRows > 0 || data?.totalRows == -1) && <>
            <div className="table-responsive">
              <table className="table card-table table-vcenter text-nowrap datatable">
                <thead>
                  <tr>
                    {data.dataColumns.map((column) => {
                      var textEnd = column.dataType == "Currency";
                      if (column.dataType == "Hidden") return <></>;
                      return <th key={column.name} className={`w-${column.dataLength} ${textEnd ? 'text-end' : ''}`}>{column.title}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {data.dataRows && data.dataRows.map((row) => {
                    return <tr key={row.rowNumber}>
                      {data.dataColumns.map((column, index) => {
                        var colValue = row.values[column.name] ?? '';
                        var textEnd = column.dataType == "Currency";
                        var name = row.values["fullName"] ?? row.values["firstName"] + " " + row.values["lastName"];
                        var id = row.values["id"];

                        if (column.dataType == "Hidden") return <></>;
                        return <td key={`${row.rowNumber}_${index}`} className={textEnd ? 'text-end' : ''} style={{ whiteSpace: 'nowrap' }}>
                          {column.drillDown && <>
                            <a className="text-reset" href={`/customers/${id}/summary`}>
                              {FormatColumn(column.dataType, colValue, name)}
                            </a>
                          </>}
                          {!column.drillDown && <>
                            {FormatColumn(column.dataType, colValue, name)}
                          </>}
                        </td>
                      })}
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
            <div className="card-footer d-flex align-items-center">
              {dataLoading == notLoading && !showPaging && data.moreRows && <button className="btn btn-default w-100" onClick={() => handlePageChange({ offset: values.offset + values.count })} >Load More</button>}
              {dataLoading == loadingMore && !showPaging && data.moreRows && <button className="btn btn-default w-100" disabled> <span className="spinner-border spinner-border-sm me-2" role="status"></span> Loading</button>}
              {showPaging && <Pagination variables={values} refetch={handlePageChange} total={data.totalRows} />}
            </div>
          </>}
        </div>
      </div>
    </div>
  </PageHeader >
}

function FormatColumn(dataType, value, name) {

  if (dataType == "String") return <span>{value}</span>;
  if (dataType == "Image") return <span><Avatar url={value} name={name} /></span>
  if (dataType == "Number") return <span>{(value == '' ? 0 : Number(value)).toLocaleString("en-US")}</span>
  if (dataType == "DateTime") return <LocalDate dateString={value} hideTime={false} />
  if (dataType == "Date") return <LocalDate dateString={value} hideTime={true} />
  if (dataType == "Boolean") return <span>{value == "1" ? 'True' : 'False'}</span>
  if (dataType == "Currency") return <span>{(value == '' ? 0 : Number(value)).toLocaleString("en-US", { style: 'currency', currency: 'USD' })}</span>
  if (dataType == "Percent") return <div className="row align-items-center">
    <div className="col-12 col-lg-auto" style={{ width: "3rem" }}>{value}%</div>
    <div className="col">
      <div className="progress" style={{ width: "3rem" }}>
        <div className="progress-bar" style={{ width: `${value}%` }} role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100" aria-label={`${value}% Complete`}>
          <span className="visually-hidden">38% Complete</span>
        </div>
      </div>
    </div>
  </div>

  if (dataType == "Level") return <span style={{ marginLeft: `${(Math.min(value, 10) - 1) * 15}px` }}>
    {value}
  </span>

  return value;

}

export default Report;