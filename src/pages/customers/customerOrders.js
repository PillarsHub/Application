import React from "react-dom/client";
import { useQuery, gql } from "@apollo/client";
import { useParams } from "react-router-dom"
import { GetScope } from "../../features/authentication/hooks/useToken"
import PageHeader from "../../components/pageHeader";
import DataLoading from "../../components/dataLoading";
import Pagination from "../../components/pagination";
import LocalDate from "../../util/LocalDate";

var GET_DATA = gql`query ($offset: Int!, $first: Int!, $nodeIds: [String]!) {
  customers(idList: $nodeIds) {
    id
    fullName
    totalOrders
    orders(offset: $offset, first: $first) {
      id
      orderDate
      invoiceDate
      orderType
      status
      tracking
      subTotal
      total
      lineItems
      {
        productId
        description
        quantity
        price
      }
    }
  }
}`;

const CustomerOrders = () => {
  let params = useParams()
  const { loading, error, data, variables, refetch } = useQuery(GET_DATA, {
      variables: { offset: 0, first: 10, nodeIds: [ params.customerId ] },
  });
  
  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  let orders = data.customers[0].orders;

  return <>
    <PageHeader preTitle="Order History" title={data?.customers[0].fullName} pageId="orders" customerId={params.customerId}>
      <div className="container-xl">
        <div className="row row-cards">
          <div className="col-md-12">
            <div className="card">
              <div className="card-body border-bottom py-3">
                <div className="row g-2 align-items-center">
                  <div className="col-auto">
                    {GetScope() == undefined && 
                      <div className="dropdown">
                        <a href={`/customers/${params.customerId}/shop`} className="btn btn-default">Add Order</a>
                      </div>
                    }
                  </div>
                  <div className="col">
                    <div className="w-100">
                      <form method="post" autoComplete="off">
                        <div className="input-icon">
                          <input className="form-control" tabIndex="1" placeholder="Enter search term" />
                          <span className="input-icon-addon">
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="10" cy="10" r="7"></circle><line x1="21" y1="21" x2="15" y2="15"></line></svg>
                          </span>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table card-table table-vcenter text-nowrap datatable">
                  <thead>
                    <tr>
                      <th className="w-1">No.</th>
                      <th>Order Date</th>
                      <th>Product</th>
                      <th>Order Type</th>
                      <th>QV</th>
                      <th>CV</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Tracking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders && orders.map((order) =>{
                      return <tr key={order.id}>
                        <td>
                          <span className="text-muted">
                            <a className="text-reset" href={`/customers/${params.customerId}/Orders/${order.id}`}>{order.id}</a>
                          </span>
                        </td>
                        <td><LocalDate dateString={order.orderDate} hideTime="true" /></td>
                        <td>
                            {order.lineItems && order.lineItems.map((item) =>{
                                return <span className="me-2" key={item.id}>{item.description}</span>
                            })}
                        </td>
                        <td>{order.orderType}</td>
                        <td> - </td>
                        <td> - </td>
                        <td>{order.total.toLocaleString("en-US", { style: 'currency', currency: order?.priceCurrency ?? 'USD'})}</td>
                        <td>
                          <span className="badge bg-success me-1"></span> {order.status}
                        </td>
                        <td></td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
              <div className="card-footer d-flex align-items-center">
                <Pagination variables={variables} refetch={refetch} total={data?.customers[0].totalOrders} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>
  </>
}

export default CustomerOrders;