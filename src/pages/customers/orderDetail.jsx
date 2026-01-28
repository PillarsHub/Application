import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../hooks/usePost";
import { GetScope, GetSettings } from "../../features/authentication/hooks/useToken.jsx";
import Tabs, { Tab } from "../../components/tabs.jsx";
import PageHeader from "../../components/pageHeader.jsx";
import DataLoading from "../../components/dataLoading.jsx";
import AutoComplete from "../../components/autocomplete";
import LocalDate from "../../util/LocalDate";
import DataError from "../../components/dataError.jsx";
import Modal from "../../components/modal.jsx";
import OrderDetailBonuses from './orderDetailBonuses.jsx';

var GET_DATA = gql`query ($orderids: [String]!, $nodeIds: [String]!) {
    customers(idList: $nodeIds) {
      id
      fullName
      totalOrders
      orders(idList: $orderids) {
        id
        customerId
        externalIds
        orderDate
        invoiceDate
        orderType
        status
        notes
        statusDetail {
          name
        }
        tracking
        trackingUrl
        subTotal
        shipping
        tax
        discount
        total
        currencyCode
        shipTo
        shipAddress {
          countryCode
          stateCode
          line1
          line2
          line3
          city
          zip
        }
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
        payments {
            amount
            authorizationNumber
            transactionNumber
            date
            merchant
            response
            paymentType
            reference
            status
        }
        sources{
            sourceGroupId
            value
        }
      }
    }
    sourceGroups{
      id
      sourceType
      dataType
    }
    countries
    {
      iso2
      name
      active
    }
  }`;

const OrderDetail = () => {
  let params = useParams()
  const [showMove, setShowMove] = useState(false);
  const [orderUpdate, setOrderUpdate] = useState();
  const [order, setOrder] = useState();
  const { loading, error, data, refetch } = useQuery(GET_DATA, {
    variables: { orderids: [params.orderId], nodeIds: [params.customerId] },
  });

  let showMenu = GetSettings().ecommerce.enableEdit;
  let hasScope = false;
  if (GetScope()) {
    showMenu = false;
    hasScope = true;
  }

  useEffect(() => {
    if (data) {
      setOrder(data?.customers[0].orders[0]);
    }
  }, [data]);

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />;

  const handleHideMove = () => setShowMove(false);
  const handleShowMove = () => {
    setOrderUpdate(order);
    setShowMove(true);
  }

  const handleEditChange = (name, value) => {
    setOrderUpdate(o => ({ ...o, [name]: value }));
  }

  const handleUpdateOrder = () => {
    const cleanedOrder = stripTypename(orderUpdate);
    const patch = createOrderPatchDocument(order, cleanedOrder);

    const customerPatch = patch.find(p => p.path === "/customerId");
    const newCustomerId = customerPatch?.value;

    if (patch.length > 0) {
      SendRequest("PATCH", `/api/v1/Orders/${order.id}`, patch, () => {
        setShowMove(false);
        if (newCustomerId && newCustomerId !== order.customerId) {
          window.location = `/customers/${newCustomerId}/orders/${order.id}`;
        } else {
          refetch();
        }
      }, (error) => {
        alert("Err:" + JSON.stringify(error));
      })
    } else {
      setShowMove(false);
    }
  }

  let address = order?.shipAddress;

  const groupedVolumes = {};
  order?.lineItems?.forEach((item) => {
    const volumes = item.volume;
    if (volumes && Array.isArray(volumes)) {
      volumes.forEach((volume) => {
        const { volumeId, volume: volumeValue } = volume;
        if (volumeId) {
          if (groupedVolumes[volumeId]) {
            groupedVolumes[volumeId] += volumeValue;
          } else {
            groupedVolumes[volumeId] = volumeValue;
          }
        }
      });
    }
  });

const calcSubTotal = 0;
    ///order?.lineItems?.reduce(
      //(total, li) => total + (li.price * li.quantity),
      //0
    //) ?? 0;

  const countryNames = data?.countries;
  const totalPaid = order?.payments?.reduce((a, payment) => a + payment?.amount ?? 0, 0) ?? 0;
  const subTotal = calcSubTotal == 0 ? order?.subTotal ?? 0 : calcSubTotal;
  const hasDiscount = order?.discount != 0;

  return <>
    <PageHeader title={data?.customers[0].fullName} customerId={params.customerId} breadcrumbs={[{ title: 'Order History', link: `/customers/${params.customerId}/orders` }, { title: "Order Detail" }]}>
      <div className="container-xl">
        <div className="row row-cards">
          <div className="col-md-5 col-xl-4">
            <div className="row row-cards">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Order {order?.id} {order?.externalIds && <>({order?.externalIds})</>}</h3>
                    {showMenu && <>
                      <div className="card-actions btn-actions">
                        <div className="dropdown">
                          <a href="#" className="btn-action" data-bs-toggle="dropdown" aria-expanded="false">
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle></svg>
                          </a>
                          <div className="dropdown-menu dropdown-menu-end" >
                            <a className="dropdown-item" href={`/customers/${params.customerId}/Orders/${params.orderId}/edit`} >
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                              Edit Order
                            </a>
                            <button className="dropdown-item" onClick={handleShowMove} >
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 15h6" /><path d="M12.5 17.5l2.5 -2.5l-2.5 -2.5" /></svg>
                              Transfer Order
                            </button>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item" onClick={handleShowMove} >
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                              Delete Order
                            </button>
                          </div>
                        </div>
                      </div>
                    </>}
                  </div>

                  <div className="card-body">

                    <dl className="row">
                      <dd className="col-5">Order Date</dd>
                      <dd className="col-7 text-end"><LocalDate dateString={order?.orderDate} /></dd>
                      <dd className="col-5">Invoice Date</dd>
                      <dd className="col-7 text-end"><LocalDate dateString={order?.invoiceDate} /></dd>
                      <dd className="col-5">Order Type</dd>
                      <dd className="col-7 text-end">{order?.orderType}</dd>

                      {groupedVolumes && Object.entries(groupedVolumes).map(([volumeId, volumeSum]) => {
                        var volumeRounded = Math.round(volumeSum * 1000) / 1000;
                        if (volumeRounded == 0) return <></>;
                        return <>
                          <dd className="col-5">{volumeId}</dd>
                          <dd className="col-7 text-end">{volumeRounded}</dd>
                        </>
                      })}

                      <dd className="col-5">Status</dd>
                      <dd className="col-7 text-end">{order?.statusDetail?.name ?? order?.status}</dd>
                      <dd className="col-5">Tracking</dd>
                      <dd className="col-7 text-end">
                        {!order?.trackingUrl && <>{order?.tracking}</>}
                        {order?.trackingUrl && <>
                          <a className="link" href={order.trackingUrl} target="_blank" rel="noreferrer">{order?.tracking}</a>
                        </>}
                      </dd>

                      <dd className="col-5">Notes</dd>
                      <dd className="col-7 text-end">{order?.notes}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/*  <div className="col-12">
                <div className="card">

                  <div className="card-header">
                    <h3 className="card-title">Payments</h3>

                    <div className="card-actions btn-actions">
                      <div className="dropdown">
                        <a href="#" className="btn-action" data-bs-toggle="dropdown" aria-expanded="false">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle></svg>
                        </a>
                        <div className="dropdown-menu dropdown-menu-end">
                          <a href="#" className="dropdown-item">Refund</a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-body">

                    * {JSON.stringify(order.payments)} *
                    * 
                                <dl className="row">
                                <dd className="col-7">
                                    <strong>Amount Paid</strong>
                                </dd>
                                <dd className="col-5 text-end"><strong>$150</strong></dd>

                                <dd className="col-7">Authorization Number</dd>
                                <dd className="col-5 text-end">A-TSTS</dd>

                                <dd className="col-7">Transaction Number</dd>
                                <dd className="col-5 text-end">T-TEST</dd>

                                <dd className="col-7">Date Paid</dd>
                                <dd className="col-5 text-end">Jan 15 2023</dd>

                                <dd className="col-7">Merchant</dd>
                                <dd className="col-5 text-end">Test Merchant</dd>

                                <dd className="col-7">Payment Response</dd>
                                <dd className="col-5 text-end">1</dd>

                                <dd className="col-7">Payment Type</dd>
                                <dd className="col-5 text-end">Charge</dd>

                                <dd className="col-7">Reference</dd>
                                <dd className="col-5 text-end">554393982</dd>

                                <dd className="col-7">Status</dd>
                                <dd className="col-5 text-end">Paid</dd>
                                </dl> *
                  </div>
                </div>
              </div>*/}
            </div>
          </div>

          <div className="col-md-7 col-xl-8">

            <Tabs showTabs={!hasScope} fill={true}>
              <Tab title="Details">
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-6">
                      <p className="h3 mb-2">{order?.shipTo ?? data?.customers[0].fullName}</p>
                      <address>
                        {address?.line1}<br />
                        {address?.city}, {address?.stateCode} {address?.zip}<br />
                        {countryNames.find(x => x.iso2?.toLowerCase() == address?.countryCode?.toLowerCase())?.name}
                      </address>
                    </div>
                    <div className="col-6 text-end">

                      {/* <dl className="row">
                      <dd className="col-7">Invoice Total</dd>
                      <dd className="col-5 text-end"><strong></strong></dd>

                      <dd className="col-7">Total Paid</dd>
                      <dd className="col-5 text-end"><strong></strong></dd>

                      <dd className="col-7">
                        <strong>Total Due</strong>
                      </dd>
                      <dd className="col-5 text-end"><strong></strong></dd>
                    </dl> */}

                    </div>
                    {/* <div className="col-12 my-5">
                    <h1>Order {order?.id}</h1>
                  </div> */}
                  </div>
                  <table className="table table-transparent table-responsive">
                    <thead>
                      <tr>
                        <th colSpan={1}>Product</th>
                        <th className="text-center" /* style="width: 1%" */>Qnt</th>
                        <th className="text-end" /* style="width: 1%" */>Unit</th>
                        <th className="text-end" /* style="width: 1%" */>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order?.lineItems && order?.lineItems.map((item) => {
                        return <tr key={item.productId}>
                          <td>
                            <p className="mb-1">{item.description}</p>
                          </td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end">{item.price.toLocaleString("en-US", { style: 'currency', currency: order?.currencyCode ?? 'USD' })}</td>
                          <td className="text-end">{(item.price * item.quantity).toLocaleString("en-US", { style: 'currency', currency: order?.currencyCode ?? 'USD' })}</td>
                        </tr>
                      })}

                      <tr>
                        <td colSpan="3" className="strong text-end">Subtotal</td>
                        <td className="text-end">{subTotal.toLocaleString("en-US", { style: 'currency', currency: order?.currencyCode ?? 'USD' })}</td>
                      </tr>
                      {hasDiscount && (
                        <tr>
                          <td colSpan="3" className="strong text-end">Discount</td>
                          <td className="text-end">{(order?.discount * -1).toLocaleString("en-US", { style: 'currency', currency: order?.currencyCode ?? 'USD' })}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="3" className="strong text-end">Shipping</td>
                        <td className="text-end">{order?.shipping.toLocaleString("en-US", { style: 'currency', currency: order?.currencyCode ?? 'USD' })}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="strong text-end">Tax {order?.taxRate > 0 ? `(${order?.taxRate} %)` : ''} </td>
                        <td className="text-end">{order?.tax.toLocaleString("en-US", { style: 'currency', currency: order?.currencyCode ?? 'USD' })}</td>
                      </tr>
                      <tr className="table-light">
                        <td colSpan="3" className="font-weight-bold text-uppercase text-end"><strong>Invoice Total</strong></td>
                        <td className="font-weight-bold text-end"><strong>{order?.total.toLocaleString("en-US", { style: 'currency', currency: order?.currencyCode ?? 'USD' })}</strong></td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="font-weight-bold text-uppercase text-end">Total Paid</td>
                        <td className="font-weight-bold text-end">{totalPaid?.toLocaleString("en-US", { style: 'currency', currency: order?.currencyCode ?? 'USD' })}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="font-weight-bold text-uppercase text-end">Total Due</td>
                        <td className="font-weight-bold text-end">{(order?.total - totalPaid)?.toLocaleString("en-US", { style: 'currency', currency: order?.currencyCode ?? 'USD' })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Tab>
              {!hasScope && <Tab title="Commissions">
                <OrderDetailBonuses orderId={params.orderId} />
              </Tab>}
            </Tabs>
          </div>
        </div>
      </div>

      <Modal showModal={showMove} onHide={handleHideMove} >
        <div className="modal-header">
          <h5 className="modal-title">Transfer Order</h5>
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div className="modal-body">
          <div className="row">
            <div className="col-md-12">
              <div className="mb-3">
                <label className="form-label">Place Under</label>
                <AutoComplete name="customerId" value={orderUpdate?.customerId ?? ""} onChange={handleEditChange} />
                <span className="text-danger"></span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
            Cancel
          </a>
          <button className="btn btn-primary ms-auto" onClick={handleUpdateOrder}>
            Transfer
          </button>
        </div>
      </Modal>

    </PageHeader>
  </>
}

function createOrderPatchDocument(originalOrder, updatedOrder) {
  const patch = [];

  // Compare customerId
  if (originalOrder.customerId !== updatedOrder.customerId) {
    patch.push({
      op: "replace",
      path: "/customerId",
      value: updatedOrder.customerId
    });
  }

  // Compare invoiceDate
  const updatedInvoiceDate = updatedOrder.invoiceDate === "" ? null : updatedOrder.invoiceDate;
  if (originalOrder.invoiceDate !== updatedInvoiceDate) {
    patch.push({
      op: "replace",
      path: "/invoiceDate",
      value: updatedInvoiceDate
    });
  }

  // Helper to normalize and compare volumes case-insensitively
  const normalizeVolumes = (volumes) => {
    return (volumes ?? [])
      .map(v => ({
        volumeId: v.volumeId.toLowerCase(),
        volume: v.volume
      }))
      .sort((a, b) => a.volumeId.localeCompare(b.volumeId));
  };

  // Compare line items
  const lineItemsChanged = (() => {
    const original = originalOrder.lineItems ?? [];
    const updated = updatedOrder.lineItems ?? [];
    if (original.length !== updated.length) return true;

    for (let i = 0; i < original.length; i++) {
      const orig = original[i];
      const upd = updated[i];

      if (orig.productId !== upd.productId) return true;

      const origVolumes = normalizeVolumes(orig.volume);
      const updVolumes = normalizeVolumes(upd.volume);

      if (origVolumes.length !== updVolumes.length) return true;

      for (let j = 0; j < origVolumes.length; j++) {
        if (
          origVolumes[j].volumeId !== updVolumes[j].volumeId ||
          origVolumes[j].volume !== updVolumes[j].volume
        ) {
          return true;
        }
      }
    }

    return false;
  })();

  if (lineItemsChanged) {
    patch.push({
      op: "replace",
      path: "/lineItems",
      value: updatedOrder.lineItems
    });
  }

  return patch;
}


function stripTypename(obj) {
  if (Array.isArray(obj)) {
    return obj.map(stripTypename);
  } else if (obj !== null && typeof obj === "object") {
    // eslint-disable-next-line no-unused-vars
    const { __typename, ...rest } = obj;
    return Object.fromEntries(
      Object.entries(rest).map(([k, v]) => [k, stripTypename(v)])
    );
  }
  return obj;
}


export default OrderDetail;