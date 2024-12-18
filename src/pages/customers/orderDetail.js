import React from "react-dom/client";
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../components/pageHeader";
import DataLoading from "../../components/dataLoading";
import LocalDate from "../../util/LocalDate";
import DataError from "../../components/dataError";

var GET_DATA = gql`query ($orderids: [String]!, $nodeIds: [String]!) {
    customers(idList: $nodeIds) {
      id
      fullName
      totalOrders
      orders(idList: $orderids) {
        id
        orderDate
        invoiceDate
        orderType
        status
        statusDetail {
          name
        }
        tracking
        subTotal
        shipping
        tax
        total
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
  }`;

const OrderDetail = () => {
  let params = useParams()
  const { loading, error, data } = useQuery(GET_DATA, {
    variables: { orderids: [params.orderId], nodeIds: [params.customerId] },
  });

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />;

  let order = data?.customers[0].orders[0];
  let address = order?.shipAddress;

  const groupedVolumes = {};
  order.lineItems?.forEach((item) => {
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

  let totalPaid = order?.payments?.reduce((a, payment) => a + payment?.amount ?? 0, 0) ?? 0;

  return <>
    <PageHeader title={data?.customers[0].fullName} customerId={params.customerId} breadcrumbs={[{ title: 'Order History', link: `/customers/${params.customerId}/orders` }, { title: "Order Detail" }]}>
      <div className="container-xl">
        <div className="row row-cards">
          <div className="col-md-5 col-xl-4">
            <div className="row row-cards">
              <div className="col-12">
                <div className="card">

                  <div className="card-header">
                    <h3 className="card-title">Order {order?.id}</h3>
                    {/* <div className="card-actions btn-actions">
                      <div className="dropdown">
                        <a href="#" className="btn-action" data-bs-toggle="dropdown" aria-expanded="false">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle></svg>
                        </a>
                        <div className="dropdown-menu dropdown-menu-end" >
                          <a href="#" className="dropdown-item" data-bs-toggle="modal" data-bs-target="#modal-edit">Edit</a>
                          <a href="#" className="dropdown-item" data-bs-toggle="modal" data-bs-target="#modal-cancel">Cancel</a>
                          <a href="#" className="dropdown-item" data-bs-toggle="modal" data-bs-target="#modal-move">Move</a>
                          <a href="#" className="dropdown-item" /* onclick="printInvoice();" / >Print Invoice</a>
                        </div>
                      </div> 
                    </div>*/}
                  </div>

                  <div className="card-body">

                    <dl className="row">
                      <dd className="col-6">Order Date</dd>
                      <dd className="col-6 text-end"><LocalDate dateString={order.orderDate} /></dd>
                      <dd className="col-6">Invoice Date</dd>
                      <dd className="col-6 text-end"><LocalDate dateString={order.invoiceDate} /></dd>
                      <dd className="col-6">Order Type</dd>
                      <dd className="col-6 text-end">{order?.orderType}</dd>

                      {groupedVolumes && Object.entries(groupedVolumes).map(([volumeId, volumeSum]) => {
                        return <>
                          <dd className="col-6">{volumeId}</dd>
                          <dd className="col-6 text-end">{Math.round(volumeSum * 1000) / 1000}</dd>
                        </>
                      })}

                      <dd className="col-6">Status</dd>
                      <dd className="col-6 text-end">{order?.statusDetail?.name ?? order?.status}</dd>
                      <dd className="col-6">Tracking</dd>
                      <dd className="col-6 text-end">{order?.tracking}</dd>

                      <dd className="col-6">Notes</dd>
                      <dd className="col-6">{data?.notes}</dd>
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
            <div className="card card-lg">
              <div className="card-body">
                <div className="row">
                  <div className="col-6">
                    <p className="h3">Shipping Address</p>
                    <address>
                      {address?.line1}<br />
                      {address?.city}, {address?.state} {address?.zip}<br />
                      {address?.country}
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
                        <td className="text-end">{item.price.toLocaleString("en-US", { style: 'currency', currency: item?.priceCurrency ?? 'USD' })}</td>
                        <td className="text-end">{(item.price * item.quantity).toLocaleString("en-US", { style: 'currency', currency: item?.priceCurrency ?? 'USD' })}</td>
                      </tr>
                    })}

                    <tr>
                      <td colSpan="3" className="strong text-end">Subtotal</td>
                      <td className="text-end">{order?.subTotal.toLocaleString("en-US", { style: 'currency', currency: order?.priceCurrency ?? 'USD' })}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="strong text-end">Shipping</td>
                      <td className="text-end">{order?.shipping.toLocaleString("en-US", { style: 'currency', currency: order?.priceCurrency ?? 'USD' })}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="strong text-end">Tax {order?.taxRate > 0 ? `(${order?.taxRate} %)` : ''} </td>
                      <td className="text-end">{order?.tax.toLocaleString("en-US", { style: 'currency', currency: order?.priceCurrency ?? 'USD' })}</td>
                    </tr>
                    <tr className="table-light">
                      <td colSpan="3" className="font-weight-bold text-uppercase text-end"><strong>Invoice Total</strong></td>
                      <td className="font-weight-bold text-end"><strong>{order?.total.toLocaleString("en-US", { style: 'currency', currency: order?.priceCurrency ?? 'USD' })}</strong></td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="font-weight-bold text-uppercase text-end">Total Paid</td>
                      <td className="font-weight-bold text-end">{totalPaid?.toLocaleString("en-US", { style: 'currency', currency: order?.priceCurrency ?? 'USD' })}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="font-weight-bold text-uppercase text-end">Total Due</td>
                      <td className="font-weight-bold text-end">{(order?.total - totalPaid)?.toLocaleString("en-US", { style: 'currency', currency: order?.priceCurrency ?? 'USD' })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>


      <div className="modal modal-blur fade" id="modal-edit" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-md modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Order</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label required">Name</label>
                    <input className="form-control" />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="mb-3">
                    <div className="divide-y">
                      <div>
                        <label className="row">
                          <span className="col">Allow Ordering</span>
                          <span className="col-auto">
                            <label className="form-check form-check-single form-switch">
                              <input className="form-check-input" type="checkbox" checked="" />
                            </label>
                          </span>
                        </label>
                      </div>
                      <div>
                        <label className="row">
                          <span className="col">Default Store</span>
                          <span className="col-auto">
                            <label className="form-check form-check-single form-switch">
                              <input className="form-check-input" type="checkbox" />
                            </label>
                          </span>
                        </label>
                      </div>
                      <div>
                        <label className="row">
                          <span className="col">Is Point-of-Sale</span>
                          <span className="col-auto">
                            <label className="form-check form-check-single form-switch">
                              <input className="form-check-input" type="checkbox" checked="" />
                            </label>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
                Cancel
              </a>
              <a href="#" className="btn btn-primary ms-auto" data-bs-dismiss="modal">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Create new report
              </a>
            </div>
          </div>
        </div>
      </div>


      <div className="modal modal-blur fade" id="modal-move" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-md modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Move Order</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label required">Name</label>
                    <input className="form-control" />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="mb-3">
                    <div className="divide-y">
                      <div>
                        <label className="row">
                          <span className="col">Allow Ordering</span>
                          <span className="col-auto">
                            <label className="form-check form-check-single form-switch">
                              <input className="form-check-input" type="checkbox" checked="" />
                            </label>
                          </span>
                        </label>
                      </div>
                      <div>
                        <label className="row">
                          <span className="col">Default Store</span>
                          <span className="col-auto">
                            <label className="form-check form-check-single form-switch">
                              <input className="form-check-input" type="checkbox" />
                            </label>
                          </span>
                        </label>
                      </div>
                      <div>
                        <label className="row">
                          <span className="col">Is Point-of-Sale</span>
                          <span className="col-auto">
                            <label className="form-check form-check-single form-switch">
                              <input className="form-check-input" type="checkbox" checked="" />
                            </label>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
                Cancel
              </a>
              <a href="#" className="btn btn-primary ms-auto" data-bs-dismiss="modal">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Create new report
              </a>
            </div>
          </div>
        </div>
      </div>



      <div className="modal modal-blur fade" id="modal-cancel" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-sm modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-body">
              <div className="modal-title">Are you sure?</div>
              <div>If you proceed, you will lose all your personal data.</div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Yes, delete all my data</button>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>
  </>
}

export default OrderDetail;