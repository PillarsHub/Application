import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../hooks/usePost";
import { GetScope } from "../../features/authentication/hooks/useToken";
import PageHeader from "../../components/pageHeader";
import DataLoading from "../../components/dataLoading";
import NumericInput from "../../components/numericInput";
import DateTimeInput from "../../components/dateTimeInput";
import DataError from "../../components/dataError";
import SelectInput from '../../components/selectInput';
import TextArea from '../../components/textArea';
import TextInput from '../../components/textInput';
import SaveButton from '../../components/saveButton';

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
        tracking
        trackingUrl
        subTotal
        shipping
        tax
        total
        currencyCode
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

const EditOrder = () => {
  let params = useParams()
  const [order, setOrder] = useState();
  const [saveSettings, setSaveSettings] = useState();
  const { loading, error, data, refetch } = useQuery(GET_DATA, {
    variables: { orderids: [params.orderId], nodeIds: [params.customerId] },
  });


  if (GetScope()) {
    return <></>
  }

  useEffect(() => {
    if (data) {
      setOrder(data?.customers[0].orders[0]);
    }
  }, [data]);

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />;


  const handleChange = (name, value) => {
    setOrder(o => ({ ...o, [name]: value }));
  }

  const handleAddressChange = (name, value) => {
    setOrder(o => ({
      ...o,
      shipAddress: {
        ...o.shipAddress,
        [name]: value
      }
    }));
  };


  const handleLineItemChange = (index, volumeId, newValue) => {
    setOrder(prevOrder => {
      const updatedLineItems = [...prevOrder.lineItems];
      const item = { ...updatedLineItems[index] };

      const updatedVolume = [...(item.volume ?? [])];
      const volumeIndex = updatedVolume.findIndex(v => v.volumeId?.toLowerCase() === volumeId.toLowerCase());

      if (volumeIndex >= 0) {
        updatedVolume[volumeIndex] = { ...updatedVolume[volumeIndex], volume: newValue };
      } else {
        updatedVolume.push({ volumeId, volume: newValue });
      }

      item.volume = updatedVolume;
      updatedLineItems[index] = item;

      return { ...prevOrder, lineItems: updatedLineItems };
    });
  };

  const handleUpdateOrder = () => {
    setSaveSettings({ status: 1 });
    const cleanedOrder = stripTypename(order);
    const original = data?.customers[0].orders[0];
    const patch = createOrderPatchDocument(original, cleanedOrder);

    const customerPatch = patch.find(p => p.path === "/customerId");
    const newCustomerId = customerPatch?.value;

    if (patch.length > 0) {
      SendRequest("PATCH", `/api/v1/Orders/${order.id}`, patch, () => {
        setSaveSettings({ status: 2 });
        if (newCustomerId && newCustomerId !== order.customerId) {
          window.location = `/customers/${newCustomerId}/orders/${order.id}`;
        } else {
          refetch();
        }
      }, (error) => {
        setSaveSettings({ status: 0, error: error });
      })
    } else {
      setSaveSettings({ status: 2 });
    }
  }

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

  const volumes = data.sourceGroups.filter((sg) => sg.id.toLowerCase() != 'mbonus' && sg.sourceType == 'SUM_VALUE' && sg.dataType == 'DECIMAL').map((sg) => sg.id);

  return <>
    <PageHeader title={data?.customers[0].fullName} customerId={params.customerId} breadcrumbs={[{ title: 'Order History', link: `/customers/${params.customerId}/orders` }, { title: params.orderId, link: `/customers/${params.customerId}/orders/${params.orderId}` }, { title: "Edit" }]}>
      <div className="container-xl">
        <div className="row row-deck row-cards">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Order {order?.id} {order?.externalIds && <>({order?.externalIds})</>}</h3>
              </div>

              <div className="card-body">
                <dl className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Order Date</label>
                    <DateTimeInput name="orderDate" value={order?.orderDate} onChange={handleChange} />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Invoice Date</label>
                    <DateTimeInput name="invoiceDate" value={order?.invoiceDate} onChange={handleChange} />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Order Type</label>
                    <TextInput name="orderType" value={order?.orderType} onChange={handleChange} />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Status</label>
                    <TextInput name="status" value={order?.status} onChange={handleChange} />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Tracking Number</label>
                    <TextInput name="tracking" value={order?.tracking} onChange={handleChange} />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Tracking Url</label>
                    <TextInput name="trackingUrl" value={order?.trackingUrl} onChange={handleChange} />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Notes</label>
                    <TextArea name="notes" value={order?.notes} onChange={handleChange} />
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card" >
              <div className="card-header">
                <h3 className="card-title">Shipping Address</h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Ship To Name</label>
                    <input className="form-control" name="shipTo" value={order?.shipTo ?? data?.customers[0]?.fullName} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Address</label>
                    <input className="form-control" name="line1" value={order?.shipAddress?.line1} onChange={(event) => handleAddressChange(event.target.name, event.target.value)} />
                  </div>
                  <div className="col-md-5 mb-3">
                    <label className="form-label">City</label>
                    <input className="form-control" name="city" value={order?.shipAddress?.city} onChange={(event) => handleAddressChange(event.target.name, event.target.value)} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">State</label>
                    <input className="form-control" name="stateCode" value={order?.shipAddress?.stateCode} onChange={(event) => handleAddressChange(event.target.name, event.target.value)} />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Zip Code</label>
                    <input className="form-control" name="zip" value={order?.shipAddress?.zip} onChange={(event) => handleAddressChange(event.target.name, event.target.value)} />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Country</label>
                    <SelectInput name="countryCode" value={order?.shipAddress?.countryCode} emptyOption="No Country Selected" onChange={handleAddressChange}>
                      {data.countries && data.countries.map((country) => {
                        return country.active ? <option key={country.iso2} value={country.iso2}>{country.name}</option> : <></>
                      })}
                    </SelectInput>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card" >
              <div className="table-responsive">
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      {volumes && volumes.map((volumeId) => {
                        return <th key={volumeId} className="w-5" style={{ minWidth: "100px" }} >{volumeId}</th>
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {order?.lineItems && order?.lineItems.map((item, index) => {
                      return <tr key={item.productId}>
                        <td>
                          <p className="mb-1">{item.description}</p>
                        </td>
                        {volumes && volumes.map((volumeId) => {
                          const volumeEntry = item.volume?.find(v => v.volumeId === volumeId);
                          return <td key={volumeId}><NumericInput name={volumeId} value={volumeEntry?.volume} onChange={(name, value) => handleLineItemChange(index, name, value)} /></td>
                        })}
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card" >
            <div className="card-footer">
              <SaveButton settings={saveSettings} onClick={handleUpdateOrder} />
            </div>
          </div>
        </div>
      </div>

    </PageHeader>
  </>
}

function createOrderPatchDocument(originalOrder, updatedOrder) {
  const patch = [];

  const compareAndPatch = (field, path = `/${field}`) => {
    if (originalOrder[field] !== updatedOrder[field]) {
      patch.push({
        op: "replace",
        path,
        value: updatedOrder[field]
      });
    }
  };

  // Top-level fields
  compareAndPatch("customerId");
  compareAndPatch("orderDate");
  compareAndPatch("orderType");
  compareAndPatch("status");
  compareAndPatch("tracking");
  compareAndPatch("trackingUrl");
  compareAndPatch("notes");
  compareAndPatch("shipTo");

  // Compare invoiceDate
  const updatedInvoiceDate = updatedOrder.invoiceDate === "" ? null : updatedOrder.invoiceDate;
  if (originalOrder.invoiceDate !== updatedInvoiceDate) {
    patch.push({
      op: "replace",
      path: "/invoiceDate",
      value: updatedInvoiceDate
    });
  }

  // Replace entire shipAddress if any part changed
  const originalShipAddress = stripTypename(originalOrder.shipAddress ?? {});
  const updatedShipAddress = stripTypename(updatedOrder.shipAddress ?? {});
  const shipAddressChanged = JSON.stringify(originalShipAddress) !== JSON.stringify(updatedShipAddress);
  if (shipAddressChanged) {
    patch.push({
      op: "replace",
      path: "/shipAddress",
      value: updatedShipAddress
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


export default EditOrder;