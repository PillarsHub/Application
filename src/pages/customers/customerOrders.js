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
        volume {
          volumeId
          volume
        }
      }
    }
  }
}`;

const CustomerOrders = () => {
  let params = useParams()
  const { loading, error, data, variables, refetch } = useQuery(GET_DATA, {
    variables: { offset: 0, first: 10, nodeIds: [params.customerId] },
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  let orders = data.customers[0].orders;

  const getUniqueVolumeIds = (orders) => {
    // Step 1: Flatten the nested arrays and filter out null or empty volumes
    const allVolumes = orders.flatMap(order =>
      order.lineItems.flatMap(lineItem =>
        lineItem.volume ? lineItem.volume : []
      )
    );

    // Step 2: Extract volumeId from each volume
    const volumeIds = allVolumes.map(volume => volume.volumeId);

    // Step 3: Get unique volumeIds using Set
    const uniqueVolumeIds = [...new Set(volumeIds)];

    return uniqueVolumeIds;
  };

  const getVolumeForVolumeId = (order, volumeId) => {
    let total = 0;
    for (const lineItem of order.lineItems) {
      if (lineItem.volume) {
        for (const volume of lineItem.volume) {
          if (volume.volumeId === volumeId) {
            total += volume.volume;
          }
        }
      }
    }
    return total;
  };



  const uniqueVolumeIds = getUniqueVolumeIds(orders);

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
                      <th>Invoice Date</th>
                      <th>Product</th>
                      <th>Order Type</th>
                      {uniqueVolumeIds.map((v, index) => {
                        return <th key={index}>{v}</th>
                      })}
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders && orders.map((order) => {
                      return <tr key={order.id}>
                        <td>
                          <span className="text-muted">
                            <a className="text-reset" href={`/customers/${params.customerId}/Orders/${order.id}`}>{order.id}</a>
                          </span>
                        </td>
                        <td>
                          <LocalDate dateString={order.orderDate} hideTime="true" />
                        </td>
                        <td>
                          <LocalDate dateString={order.invoiceDate} hideTime="true" />
                        </td>
                        <td>
                          {order.lineItems && order.lineItems.slice(0, 1).map((item) => (
                            <span className="me-2" key={item.id}>
                              {item.description}
                            </span>
                          ))}
                          {order.lineItems && order.lineItems.length > 2 && <span>+{order.lineItems.length - 1}</span>}
                        </td>
                        <td>{order.orderType}</td>
                        {uniqueVolumeIds.map((volumeId, index) => {
                          const volume = getVolumeForVolumeId(order, volumeId);
                          return <td key={index}>{volume !== null ? volume : 'N/A'}</td>
                        })}
                        <td>{order.total.toLocaleString("en-US", { style: 'currency', currency: order?.priceCurrency ?? 'USD' })}</td>
                        <td>{order.status}</td>
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