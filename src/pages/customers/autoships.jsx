import React from 'react';
import { useQuery, gql } from "@apollo/client";
import { useParams } from "react-router-dom"
import { GetScope } from "../../features/authentication/hooks/useToken.jsx"
import PageHeader, { CardHeader } from "../../components/pageHeader.jsx";
import DataLoading from "../../components/dataLoading.jsx";
import DataError from '../../components/dataError.jsx';
import LocalDate from '../../util/LocalDate.jsx';

var GET_CUSTOMERS = gql`query ($customerIds: [String]) {
  customers(idList: $customerIds) {
    fullName
    autoships {
      id
      customerId
      startDate
      frequency
      autoshipType
      shippingMethod
      paymentMethod
      status
      lastAutoshipDate
      nextAutoshipDate
      address {
        countryCode
        stateCode
        line1
        line2
        line3
        city
        zip
      }
      lineItems {
        itemId
        quantity
        product {
          id
          name
          description
          specifications
          imageUrl
          prices {
            id
            volume {
              volumeId
              volume
            }
            price
          }
        }
      }
    }
  }
}`;


const Autoships = () => {
  let params = useParams()
  const { loading, error, data } = useQuery(GET_CUSTOMERS, {
    variables: { customerIds: [params.customerId] },
  });

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />

  const handleAdd = () => {
    alert('Add Autoship')
  }

  const handleProcess = () => {
    alert('Process')
  }

  const handleMarkProcessed = () => {
    alert("Mark Processed");
  }

  const handleDelete = () => {
    alert('Delete')
  }

  return (
    <PageHeader preTitle="Autoships" title={data?.customers[0].fullName} customerId={params.customerId} >
      <CardHeader>
        {GetScope() == undefined &&
          <div className="dropdown">
            <button className="btn btn-default" onClick={handleAdd}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-calendar-dollar"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M13 21h-7a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v3" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h12.5" /><path d="M21 15h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5" /><path d="M19 21v1m0 -8v1" /></svg>
              Add Autoship
            </button>
          </div>
        }
      </CardHeader>
      <div className="container-xl">
        <div className="row row-cards">
          {!(data?.customers?.[0]?.autoships.length > 0 ?? false) && <>
            <div className="empty">
              <p className="empty-title">No Autoship Orders Found</p>
              <p className="empty-subtitle text-muted">
                You do not have any autoship orders set up at the moment. To enjoy the convenience of regular deliveries, please set up an autoship order.
              </p>
              <div className="empty-action">
                <button className="btn btn-primary" onClick={handleAdd}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-calendar-dollar"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M13 21h-7a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v3" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h12.5" /><path d="M21 15h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5" /><path d="M19 21v1m0 -8v1" /></svg>
                  Add Autoship
                </button>
              </div>
            </div>
          </>}

          {data?.customers[0].autoships && data?.customers[0].autoships.map((autoship) => {
            return <div key={autoship.id} className="col-12">
              <div className="card">
                <div className="row">
                  <div className="col-8 border-end">
                    {autoship.lineItems && autoship.lineItems.map((lineItem, index) => {

                      let product = lineItem?.product;

                      return <div key={`${lineItem.itemId}_${index}`} className="card-body">
                        <div className="row">
                          <div className="col-md-12 col-lg-3 col-xl-3 mb-4 mb-lg-0">
                            <div className="bg-image hover-zoom ripple rounded ripple-surface">
                              <img src="/images/noimage.jpg" className="w-100" />
                              <a href="#!">
                                <div className="hover-overlay">
                                  <div className="mask">
                                  </div>
                                </div>
                              </a>
                            </div>
                          </div>
                          <div className="col-md-6 col-lg-6 col-xl-6">
                            <h2>{product?.name ?? lineItem.itemId}</h2>
                            <div className="mt-1 mb-0 text-muted small">
                              <span>100% cotton</span>
                              <span className="text-primary"> • </span>
                              <span>Light weight</span>
                              <span className="text-primary"> • </span>
                              <span>Best finish<br />
                              </span>
                            </div>
                            <div className="mb-2 text-muted small">
                              <span>Unique design</span>
                              <span className="text-primary"> • </span>
                              <span>For men</span>
                              <span className="text-primary"> • </span>
                              <span>Casual<br /></span>
                            </div>
                            <p className=" mb-4 mb-md-0"> {/* text-truncate */}
                              {JSON.stringify(product)}
                            </p>
                          </div>
                          <div className="col-md-6 col-lg-3 col-xl-3 border-sm-start-none border-start">
                            {product?.prices && product.prices.map((p, pIndex) => {
                              return <div key={pIndex} className="d-flex flex-row align-items-center mb-1">
                                <h4 className="mb-1 me-1">{p.price} {JSON.stringify(p.volume)}</h4>
                              </div>
                            })}
                            <h6 className="text-success"></h6>
                            <div className="d-flex flex-column mt-4">
                              <button className="btn btn-outline-danger btn-sm mt-2" type="button">Remove</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    })}
                    <div className="card-body">
                      <a href={`/customers/${params.customerId}/shop`} className="btn btn-primary" >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-shopping-cart-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M12.5 17h-6.5v-14h-2" /><path d="M6 5l14 1l-.86 6.017m-2.64 .983h-10.5" /><path d="M16 19h6" /><path d="M19 16v6" /></svg>
                        Add Item
                      </a>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="card-body ps-2">
                      <dl className="row">
                        <div className="col-auto mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-calendar"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M11 15h1" /><path d="M12 15v3" /></svg>
                        </div>
                        <div className="col">
                          <div className="markdown">
                            <h3>Frequency</h3>
                            <address>
                              <strong>{autoship.frequency}</strong> starting on <strong><LocalDate dateString={autoship.startDate} hideTime={true} /></strong> <br />
                              Next process day is <strong><LocalDate dateString={autoship.nextAutoshipDate} hideTime={true} /></strong>
                            </address>
                          </div>
                        </div>
                        <div className="col-auto">
                          <button className="btn btn-icon btn-ghost-secondary" >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                          </button>
                        </div>
                      </dl>
                    </div>
                    <div className="card-body ps-2">
                      <dl className="row">
                        <dt className="col-auto mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-truck-delivery"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" /><path d="M3 9l4 0" /></svg>
                        </dt>
                        <dd className="col">
                          <div className="markdown">
                            <h3>Shipping Method</h3>
                            <address>
                              {autoship.shippingMethod}
                            </address>
                          </div>
                        </dd>
                        <div className="col-auto">
                          <button className="btn btn-icon btn-ghost-secondary" >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                          </button>
                        </div>
                      </dl>
                    </div>
                    <div className="card-body ps-2">
                      <dl className="row">
                        <dt className="col-auto mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="11" r="3"></circle><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path></svg>
                        </dt>
                        <dd className="col">
                          <div className="markdown">
                            <h3>Shipping Address</h3>
                            <address>
                              {autoship.address.line1}, {autoship.address.line2} <br />
                              {autoship.address.city}, {autoship.address.stateCode} {autoship.address.zip}
                            </address>
                          </div>
                        </dd>
                        <div className="col-auto">
                          <button className="btn btn-icon btn-ghost-secondary" >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                          </button>
                        </div>
                      </dl>
                    </div>
                    <div className="card-body ps-2">
                      <dl className="row">
                        <dt className="col-auto mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-credit-card"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" /><path d="M3 10l18 0" /><path d="M7 15l.01 0" /><path d="M11 15l2 0" /></svg>
                        </dt>
                        <dd className="col">
                          <div className="markdown">
                            <h3>Payment Method</h3>
                            <div>
                              {autoship.paymentMethod}
                            </div>
                          </div>
                        </dd>
                        <div className="col-auto">
                          <button className="btn btn-icon btn-ghost-secondary" >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
                          </button>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="card-title">
                    <div className="btn-list">
                      <button className="btn" onClick={handleProcess}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-circle-arrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" /><path d="M16 12l-4 -4" /><path d="M16 12h-8" /><path d="M12 16l4 -4" /></svg>
                        Process
                      </button>
                      <button className="btn" onClick={handleMarkProcessed}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-circle-check"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                        Mark Processed
                      </button>
                      <button className="btn" onClick={handleDelete}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          })}
        </div>
      </div>
    </PageHeader>
  );
};

export default Autoships;