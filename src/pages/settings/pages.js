import React from "react";
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../components/pageHeader";
import SettingsNav from "./settingsNav";

var GET_DATA = gql`query {
  trees {
    id
    name
  }
}`;

const Pages = () => {
  const { loading, error, data } = useQuery(GET_DATA, { variables: {} });

  return <>
    <PageHeader title="Pages" preTitle="Settings">
      <SettingsNav title="Pages" loading={loading} error={error} pageId="pages">
        <div className="card-header">
          <span className="card-title">Pages</span>
        </div>
        <table className="table table-vcenter table-border table-nowrap card-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Type</th>
              <th className="w-1"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dashboard</td>
              <td>Customer Dashboard</td>
              <td>Page</td>
              <td className="text-end">
                <a className="btn btn-ghost-secondary btn-icon" href={`/settings/pages/dashboard`} >
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                </a>
              </td>
            </tr>
            <tr>
              <td>Customer Details</td>
              <td>Customer Details</td>
              <td>Page</td>
              <td className="text-end">
                <a className="btn btn-ghost-secondary btn-icon" href={`/settings/pages/customer`} >
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                </a>
              </td>
            </tr>
            <tr>
              <td>Earnings</td>
              <td>Customer Earnings</td>
              <td>Page</td>
              <td className="text-end">
                <a className="btn btn-ghost-secondary btn-icon" href={`/settings/pages/earnings`} >
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                </a>
              </td>
            </tr>
            <tr>
              <td>Orders</td>
              <td>Customer Orders</td>
              <td>Page</td>
              <td className="text-end">
                <a className="btn btn-ghost-secondary btn-icon" href={`/settings/pages/orders`} >
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                </a>
              </td>
            </tr>
            {data && data.trees && data.trees.map((tree) => {
              return <tr key={`tree_${tree.id}`}>
                <td>{tree.name} Tree</td>
                <td>Customer {tree.name} Tree</td>
                <td>Page</td>
                <td className="text-end">
                  <a className="btn btn-ghost-secondary btn-icon" href={`/settings/pages/tree/${tree.id}`} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  </a>
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </SettingsNav>
    </PageHeader>
  </>
}



export default Pages;