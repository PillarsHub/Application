import React from "react-dom/client";
import { useState } from 'react';
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../hooks/usePost.js";
import PageHeader from "../../components/pageHeader.jsx";
import DataLoading from "../../components/dataLoading.jsx";
import AutoComplete from "../../components/autocomplete.jsx";

var GET_DATA = gql`query{
  customerStatuses{
    id
    name
  }
  countries
  {
    iso2
    name
    customData
  }
  languages
  {
    iso2
    name
  }
  sourceGroups
  {
    id
    acceptedValues
    {
      value
      description
    }
  }
}`;

const NewCustomer = () => {
  const [activeItem, setActiveItem] = useState({});
  const { loading, error, data } = useQuery(GET_DATA, {
    variables: {},
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const customerTypes = data.sourceGroups.find(elem => elem.id == 'CustType')?.acceptedValues;

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault();

    var item = {
      firstName: activeItem.firstName,
      lastName: activeItem.lastName,
      companyName: activeItem.companyName,
      sponsorId: activeItem.sponsorId,
      addresses: [
        {
          type: "Billing",
          line1: activeItem.billing_line1,
          city: activeItem.billing_city,
          stateCode: activeItem.billing_state,
          zip: activeItem.billing_zip,
          countryCode: activeItem.billing_country ?? 'us'
        },
        {
          type: "Shipping",
          line1: activeItem.shipping_line1,
          city: activeItem.shipping_city,
          stateCode: activeItem.shipping_state,
          zip: activeItem.shipping_zip,
          countryCode: activeItem.shipping_country ?? 'us'
        }
      ],
      customerType: activeItem.customerType,
      status: activeItem.status,
      phoneNumbers: [
        {
          number: activeItem.primaryPhone,
          type: "primary"
        },
        {
          number: activeItem.secondaryPhone,
          type: "secondary"
        }
      ],
      emailAddress: activeItem.emailAddress,
      language: activeItem.language,
      birthDate: activeItem.birthDate,
      profileImage: activeItem.profileImage,
    };

    SendRequest("POST", "/api/v1/customers", item, (r) => {
      const now = new Date();
      let postDate = now.toISOString();
      SendRequest("POST", "/api/v1/Sources", {
        nodeId: r.id,
        sourceGroupId: "EnrollDate",
        date: postDate,
        value: postDate,
        externalId: r.id
      });

      SendRequest("POST", "/api/v1/Sources", {
        nodeId: r.id,
        sourceGroupId: "CustType",
        date: postDate,
        value: activeItem.customerType,
        externalId: r.id
      });

      SendRequest("POST", "/api/v1/Sources", {
        nodeId: r.id,
        sourceGroupId: "Status",
        date: postDate,
        value: activeItem.status,
        externalId: r.id
      });

      var placement = { nodeId: r.id, uplineId: item.sponsorId };
      SendRequest("POST", "/api/v1/placements", placement, () => {
        window.location = `/customers/${r.id}/summary`;
      }, (error) => {
        alert(error);
      });
    }, (error) => {
      alert(error);
    });
  }

  return <PageHeader title="New Customer">
    <div className="container-xl">
      <form onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="">
          <div className="row row-cards">
            <div className="col-md-12">
              <div className="card" >
                <div className="card-header">
                  <h3 className="card-title">Enrollment Type</h3>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label required">Customer Type</label>
                        <select className="form-select" name="customerType" value={activeItem.customerType} onChange={(event) => handleChange(event.target.name, event.target.value)}>
                          <option>Select Option</option>
                          {customerTypes && customerTypes.map((ctype) => {
                            return <option key={ctype.value} value={ctype.value}>{ctype.description}</option>
                          })}
                        </select>
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label required">Customer Status</label>
                        <select className="form-select" name="status" value={activeItem.status} onChange={(event) => handleChange(event.target.name, event.target.value)}>
                          <option>Select Option</option>
                          {data.customerStatuses && data.customerStatuses.map((ctype) => {
                            return <option key={ctype.id} value={ctype.id}>{ctype.name}</option>
                          })}
                        </select>
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Sponsor</label>
                        <AutoComplete name="sponsorId" onChange={handleChange} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="col-md-8">
              <div className="card" >
                <div className="card-header">
                  <h3 className="card-title">Profile</h3>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label required">Legal First Name</label>
                        <input className="form-control" name="firstName" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label required">Legal Last Name</label>
                        <input className="form-control" name="lastName" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Display First Name</label>
                        <input className="form-control" name="displayFirst" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Display Last Name</label>
                        <input className="form-control" name="displayLast" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Company Name</label>
                        <input className="form-control" name="companyName" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Birthdate</label>
                        <input type="date" className="form-control" autoComplete="off" name="birthDate" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Profile Image Url</label>
                        <input className="form-control" name="profileImage" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="col-md-4">
              <div className="card" >
                <div className="card-header">
                  <h3 className="card-title">Contact Info</h3>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label required">Primary Phone</label>
                    <input className="form-control" name="primaryPhone" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                    <span className="text-danger"></span>
                  </div>
                  <div className="mb-3">
                    <label className="form-label required">Secondary Phone</label>
                    <input className="form-control" name="secondaryPhone" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                    <span className="text-danger"></span>
                  </div>
                  <div className="mb-3">
                    <label className="form-label required">Email Address</label>
                    <input className="form-control" name="emailAddress" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                    <span className="text-danger"></span>
                  </div>
                  <div className="mb-3">
                    <label className="form-label required">Language</label>
                    <select className="form-select" name="language" onChange={(event) => handleChange(event.target.name, event.target.value)}>
                      <option>Select Option</option>
                      {data.languages && data.languages.map((language) => {
                        return <option key={language.iso2} value={language.iso2}>{language.name}</option>
                      })}
                    </select>
                    <span className="text-danger"></span>
                  </div>
                </div>

              </div>
            </div>

            <div className="col-md-6">
              <div className="card" >
                <div className="card-header">
                  <h3 className="card-title">Customer Address</h3>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label required">Address</label>
                        <input className="form-control" name="billing_line1" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="mb-3">
                        <label className="form-label required">City</label>
                        <input className="form-control" name="billing_city" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label required">State</label>
                        <input className="form-control" name="billing_state" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label required">Zip Code</label>
                        <input className="form-control" name="billing_zip" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label required">Country</label>
                        <select className="form-select" name="billing_country" onChange={(event) => handleChange(event.target.name, event.target.value)}>
                          {data.countries && data.countries.map((country) => {
                            return country.customData ? <option key={country.iso2} value={country.iso2}>{country.name}</option> : <></>
                          })}
                        </select>
                        <span className="text-danger"></span>
                      </div>
                    </div>
                  </div>
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
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label required">Address</label>
                        <input className="form-control" name="shipping_line1" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="mb-3">
                        <label className="form-label required">City</label>
                        <input className="form-control" name="shipping_city" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label required">State</label>
                        <input className="form-control" name="shipping_state" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label required">Zip Code</label>
                        <input className="form-control" name="shipping_zip" onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label required">Country</label>
                        <select className="form-select" name="shipping_country" onChange={(event) => handleChange(event.target.name, event.target.value)}>
                          {data.countries && data.countries.map((country) => {
                            return country.customData ? <option key={country.iso2} value={country.iso2}>{country.name}</option> : <></>
                          })}
                        </select>
                        <span className="text-danger"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="card">

          <div className="card-footer">
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </div>
      </form>
    </div>
  </PageHeader>
}

export default NewCustomer;