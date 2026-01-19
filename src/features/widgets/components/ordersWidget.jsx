import React from "react";
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import { GetScope } from "../../../features/authentication/hooks/useToken.jsx"
import DataLoading from "../../../components/dataLoading.jsx";
import DataError from "../../../components/dataError.jsx";
import LocalDate from "../../../util/LocalDate";
import Pagination from "../../../components/pagination.jsx";
import EmptyContent from "../../../components/emptyContent.jsx";

var GET_DATA = gql`query ($offset: Int!, $first: Int!, $nodeIds: [String]!) {
  customers(idList: $nodeIds) {
    id
    fullName
    totalOrders
    orders(offset: $offset, first: $first) {
      id
      externalIds
      orderDate
      invoiceDate
      orderType
      status
      statusDetail {
        id
        name
        visibility
      }
      tracking
      subTotal
      total
      currencyCode
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

const OrdersWidget = ({ customer, useExternalId }) => {
  const { loading, error, data, variables, refetch } = useQuery(GET_DATA, {
    variables: { offset: 0, first: 10, nodeIds: [customer?.id] },
  });

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} showHeader={false} />

  let orders = data.customers?.[0]?.orders ?? [];
  let totalOrders = data.customers?.[0]?.totalOrders ?? 0;

  const getUniqueVolumeIds = (orders) => {
    // Step 1: Flatten the nested arrays and filter out null or empty volumes
    const allVolumes = orders.flatMap(order =>
      order.lineItems?.flatMap(lineItem =>
        lineItem.volume ? lineItem.volume : []
      ) ?? []
    );

    // Step 2: Extract volumeId from each volume
    const volumeIds = allVolumes.filter(item => item.volume != 0).map(volume => volume.volumeId);

    // Step 3: Get unique volumeIds using Set
    const uniqueVolumeIds = [...new Set(volumeIds)];

    return uniqueVolumeIds ?? [];
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
    return Math.round(total * 1000) / 1000;
  };

  const uniqueVolumeIds = getUniqueVolumeIds(orders);

  if (!data?.customers?.[0]) {
    return <EmptyContent title="Customer Not Found" text="The customer requested cannot be found." ></EmptyContent>
  }

  return <>
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
            var show = order.statusDetail?.visibility === 1 ? false : true;
            if (!show && GetScope() != undefined) return <></>;

            return <tr key={order.id} className={show ? '' : 'text-muted'}>
              <td>
                <span className="text-muted">
                  <a className="text-reset" href={`/customers/${customer.id}/Orders/${order.id}`}>
                    {!useExternalId && <>{order.id}</>}
                    {useExternalId && <>{order.externalIds || order.id}</>}
                  </a>
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
                return <td key={index}>{(volume !== null ? volume : 0) == 0 ? '-' : volume}</td>
              })}
              <td>{order.total.toLocaleString("en-US", { style: 'currency', currency: order?.currencyCode ?? 'USD' })}</td>
              <td>{order.statusDetail?.name ?? order.status}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
    <div className="card-footer d-flex align-items-center">
      <Pagination variables={variables} refetch={refetch} total={totalOrders} />
    </div>
  </>
}

export default OrdersWidget;

OrdersWidget.propTypes = {
  customer: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired,
  useExternalId: PropTypes.bool.isRequired
}



/* 

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
          var show = order.statusDetail?.visibility === 1 ? false : true;
          if (!show && GetScope() != undefined) return <></>;

          return <tr key={order.id} className={show ? '' : 'text-muted'}>
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
            <td>{order.statusDetail?.name ?? order.status}</td>
          </tr>
        })}
      </tbody>
    </table>
  </div>
  <div className="card-footer d-flex align-items-center">
    <Pagination variables={variables} refetch={refetch} total={data?.customers[0].totalOrders} />
  </div>
</div> */