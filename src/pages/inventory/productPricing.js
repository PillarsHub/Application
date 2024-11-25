import React, { useState } from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../hooks/usePost";
import DataLoading from "../../components/dataLoading";
import Modal from "../../components/modal"
import PageHeader from "../../components/pageHeader";
import ProductNav from "./productNav";
import MultiSelect from "../../components/muliselect"
import VolumeInput from './volumeInput';

var GET_DATA = gql`query ($productIds: [String]!) {
  products(idList: $productIds) {
    id
    prices {
      id
      price
      priceCurrency
      start
      end
      storeIds
      customerTypeIds
      orderTypeIds
      regionIds
      volume {
        volumeId
        volume
      }
    }
  }
  customerTypes {
    id
    name
  }
  regions {
    id
    name
  }
  stores {
    id
    name
  }
  orderTypes {
    id
    name
  }
  currencies {
    iso3
  }
  sourceGroups {
    id
    sourceType
    dataType
  }
}`;

const ProductPricing = () => {
  let params = useParams()
  const [show, setShow] = useState(false);
  const [activeItem, setActiveItem] = useState();
  const { loading, error, data, refetch } = useQuery(GET_DATA, {
    variables: { productIds: [params.productId], date: "05/10/2023" },
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const volumes = data.sourceGroups.filter((sg) => sg.sourceType == 'SUM_VALUE' && sg.dataType == 'DECIMAL').map((sg) => sg.id);
  const product = data.products[0];

  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    var item = product.prices.find(element => element.id == id);
    if (item === undefined) item = { id: id, priceCurrency: 'usd', isNew: true };
    setActiveItem(item);
    setShow(true);
  }

  const handleSubmit = async e => {
    e.preventDefault();

    let item = {
      id: activeItem.id,
      price: parseFloat(activeItem.price),
      priceCurrency: activeItem.priceCurrency,
      volume: activeItem.volume,
      start: activeItem.start,
      end: activeItem.end,
      priceType: activeItem.priceType,
      storeIds: activeItem.storeIds,
      priceGroups: activeItem.customerTypeIds,
      regionIds: activeItem.regionIds,
      orderTypeIds: activeItem.orderTypeIds
    };

    var url = `/api/v1/Products/${params.productId}/Prices`;
    var method = "POST";

    if (!activeItem.isNew) {
      url += `/${item.id}`;
      method = "PUT";
    }

    SendRequest(method, url, item, () => {
      refetch();
      setShow(false);
    }, (code, error) => {
      alert(code + ' ' + error);
    });
  }

  return <PageHeader title="Pricing" preTitle="Products">
    <div className="container-xl">
      <ProductNav productId={params.productId} />
      <div className="row row-cards">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <button type="submit" className="btn btn-primary" onClick={() => handleShow('')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Price
              </button>
            </div>
            <div>
              <div className="table-responsive">
                <table className="table card-table table-vcenter text-nowrap datatable">
                  <thead>
                    <tr>
                      <th>Customer Types</th>
                      <th>Regions</th>
                      <th>Order Type</th>
                      <th>Stores</th>
                      <th>Price</th>
                      <th>Display</th>
                      <th>Begin</th>
                      <th>End</th>
                      <th className="w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {product && product.prices.map((price) => {
                      return <tr key={price.id}>
                        <td>
                          {price.customerTypeIds && price.customerTypeIds.map((cType) => {
                            return <span className="badge badge-outline text-blue m-1" key={cType} >{data.customerTypes.find(i => i.id == cType)?.name ?? cType}</span>
                          })}
                        </td>
                        <td>
                          {price.regionIds && price.regionIds.map((regionId) => {
                            return <span className="badge badge-outline text-blue m-1" key={regionId} >{data.regions.find(i => i.id == regionId)?.name ?? regionId}</span>
                          })}
                        </td>
                        <td>
                          {price.orderTypeIds && price.orderTypeIds.map((orderTypeId) => {
                            return <span className="badge badge-outline text-blue m-1" key={orderTypeId} >{data.orderTypes.find(i => i.id == orderTypeId)?.name ?? orderTypeId}</span>
                          })}
                        </td>
                        <td>
                          {price.storeIds && price.storeIds.map((storeId) => {
                            return <span className="badge badge-outline text-blue m-1" key={storeId} >{data.stores.find(i => i.id == storeId)?.name ?? storeId}</span>
                          })}
                        </td>
                        <td>{price.price.toLocaleString("en-US", { style: 'currency', currency: price?.priceCurrency ?? 'USD' })}</td>
                        <td>Price</td>
                        <td>{price.start}</td>
                        <td>{price.end ?? '[No End]'}</td>
                        <td>
                          <div className="btn-list flex-nowrap">
                            <button className="btn-link text-muted" onClick={() => handleShow(price.id)}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                            </button>
                            {/* <button type="submit" className="btn-link text-muted" >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                                                        </button>   */}
                          </div>
                        </td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal showModal={show} onHide={handleClose}>
      <div className="modal-header">
        <h5 className="modal-title">Price and Discounts</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <input type="hidden" />
        <input type="hidden" />
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Display As</label>
              <select className="form-select">
                <option>Price</option>
                <option>Discount</option>
              </select>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Price</label>
              <div className="input-group">
                <input className="form-control" name="price" value={activeItem?.price || ''} onChange={(e) => handleChange(e.target.name, e.target.value)} />
                <select className="form-select" name="priceCurrency" value={activeItem?.priceCurrency || ''} onChange={(e) => handleChange(e.target.name, e.target.value)} >
                  {data.currencies && data.currencies.map((currency) => {
                    return <option key={currency.iso3} value={currency.iso3}>{currency.iso3.toUpperCase()}</option>
                  })}
                </select>
              </div>
              <span className="text-danger"></span>
            </div>
          </div>
        </div>
        <VolumeInput volumeIds={volumes} name="volume" value={activeItem?.volume || ""} onChange={handleChange} />
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Stores</label>
              <MultiSelect className="form-select" name="storeIds" value={activeItem?.storeIds || ""} onChange={handleChange} >
                {data.stores && data.stores.map((store) => {
                  return <option key={store.id} value={store.id}>{store.name}</option>
                })}
              </MultiSelect>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Customer Types</label>
              <MultiSelect className="form-select" name="customerTypeIds" value={activeItem?.customerTypeIds || ""} onChange={handleChange} >
                {data.customerTypes && data.customerTypes.map((customerType) => {
                  return <option key={customerType.id} value={customerType.id}>{customerType.name}</option>
                })}
              </MultiSelect>
              <span className="text-danger"></span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Order Types</label>
              <MultiSelect className="form-select" name="orderTypeIds" value={activeItem?.orderTypeIds || ""} onChange={handleChange}>
                {data.orderTypes && data.orderTypes.map((orderType) => {
                  return <option key={orderType.id} value={orderType.id}>{orderType.name}</option>
                })}
              </MultiSelect>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Regions</label>
              <MultiSelect className="form-select" name="regionIds" value={activeItem?.regionIds || ""} onChange={handleChange} >
                {data.regions && data.regions.map((region) => {
                  return <option key={region.id} value={region.id}>{region.name}</option>
                })}
              </MultiSelect>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Begin Date</label>
              <input type="datetime-local" className="form-control" name="start" value={activeItem?.start} onChange={(e) => handleChange(e.target.name, e.target.value)} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">End Date</label>
              <input type="datetime-local" className="form-control" name="end" value={activeItem?.end} onChange={(e) => handleChange(e.target.name, e.target.value)} />
              <span className="text-danger"></span>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button className="btn btn-primary ms-auto" onClick={handleSubmit}>
          Save Price
        </button>
      </div>
    </Modal>


  </PageHeader>
}

export default ProductPricing;