import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../hooks/usePost";
import PageHeader from "../../components/pageHeader";
import DataLoading from "../../components/dataLoading";
import DataError from "../../components/dataError";
import SelectInput from "../../components/selectInput";
import Avatar from '../../components/avatar';
import ChangeProfileImage from './account/changeProfileImage';
import TextInput from '../../components/textInput';
import DateInput from '../../components/dateInput';

var GET_DATA = gql`query ($nodeId: ID!) {
  customer(id: $nodeId)
  {
    id
    firstName
    lastName
    enrollDate
    customerType {
      id
    }
    companyName
    language
    emailAddress
    birthDate
    profileImage
    webAlias
    status {
        id
    }
    addresses{
        type
        line1
        line2
        line3
        city
        stateCode
        zip
        countryCode
    }
    phoneNumbers{
        type
        number
    }
  }
  customerTypes{
    id
    name
  }
  countries
  {
    iso2
    name
    active
  }
  languages
  {
    iso2
    name
  }
}`;

const EditCustomer = () => {
  let params = useParams()
  const [activeItem, setActiveItem] = useState({});
  const [showCrop, setShowCrop] = useState();
  const { loading, error, data } = useQuery(GET_DATA, {
    variables: { nodeId: params.customerId },
  });

  useEffect(() => {
    if (data && activeItem.id != data.customer.id) {
      var billAddress = data.customer.addresses?.find(i => i.type.toLowerCase() == "billing");
      var shipAddress = data.customer.addresses?.find(i => i.type.toLowerCase() == "shipping");

      setActiveItem({
        id: data.customer.id,
        firstName: data.customer.firstName,
        lastName: data.customer.lastName,
        companyName: data.customer.companyName,
        customerType: data.customer.customerType.id,
        status: data.customer.status.id,
        emailAddress: data.customer.emailAddress,
        language: data.customer.language,
        birthDate: data.customer.birthDate,
        profileImage: data.customer.profileImage,
        webAlias: data.customer.webAlias,

        primaryPhone: data.customer.phoneNumbers?.find(i => i.type?.toLowerCase() == "primary")?.number,
        secondaryPhone: data.customer.phoneNumbers?.find(i => i.type?.toLowerCase() == "secondary")?.number,

        billing_line1: billAddress?.line1,
        billing_city: billAddress?.city,
        billing_state: billAddress?.stateCode,
        billing_zip: billAddress?.zip,
        billing_country: billAddress?.countryCode,

        shipping_line1: shipAddress?.line1,
        shipping_city: shipAddress?.city,
        shipping_state: shipAddress?.stateCode,
        shipping_zip: shipAddress?.zip,
        shipping_country: shipAddress?.countryCode
      });
    }
  }, [data]);

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />;

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault();

    var item = {
      id: activeItem.id,
      firstName: activeItem.firstName,
      lastName: activeItem.lastName,
      companyName: activeItem.companyName,
      webAlias: activeItem.webAlias,
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

    SendRequest("PUT", `/api/v1/customers/${item.id}`, item, (r) => {
      window.location = `/customers/${r.id}/summary`;
    }, (error) => {
      alert(error);
    });
  }

  const handleHideModal = () => setShowCrop(false);
  const handleShowModal = () => setShowCrop(true);
  const handleUpdateModal = () => {
    //refetch();
    setShowCrop(false);
  }

  return <PageHeader title="Edit Customer" breadcrumbs={[{ title: `${activeItem.firstName} ${activeItem.lastName}`, link: `/customers/${params.customerId}/summary` }, { title: "Edit Customer" }]}>
    <div className="container-xl">
      <form onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="">
          <div className="row row-deck row-cards">
            <div className="col-md-8">
              <div className="card" >
                <div className="card-header">
                  <h3 className="card-title">Profile</h3>
                </div>
                <div className="row">
                  <div className="col-md-3 border-end card-body">

                    <div className="d-flex justify-content-center align-items-center rounded" style={{ height: '140px', backgroundColor: 'rgb(233, 236, 239)' }}>
                      <Avatar name={`${activeItem?.firstName} ${activeItem?.lastName}`} size="xl" url={activeItem?.profileImage} />
                    </div>

                    <div className="mt-2">
                      <button className="btn btn-default w-100" type="button" onClick={handleShowModal}>
                        <i className="fa fa-fw fa-camera"></i>
                        <span>Change Photo</span>
                      </button>
                    </div>
                  </div>
                  <div className="col-md-9 card-body border-0">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label required">First Name</label>
                          <input className="form-control" name="firstName" value={activeItem.firstName} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                          <span className="text-danger"></span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label required">Last Name</label>
                          <input className="form-control" name="lastName" value={activeItem.lastName} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                          <span className="text-danger"></span>
                        </div>
                      </div>
                      {/* <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Display First Name</label>
                        <input className="form-control" name="displayFirst" value={activeItem.displayFirst} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Display Last Name</label>
                        <input className="form-control" name="displayLast" value={activeItem.displayLast} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div> */}
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Handle</label>
                          <input className="form-control" name="webAlias" value={activeItem.webAlias} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                          <span className="text-danger"></span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Customer Type</label>
                          <SelectInput name="customerType" value={activeItem.customerType} onChange={handleChange} >
                            {data.customerTypes.map((cType) => {
                              return <option key={cType.id} value={cType.id}>{cType.name}</option>
                            })}
                          </SelectInput>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Company Name</label>
                          <input className="form-control" name="companyName" value={activeItem.companyName} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                          <span className="text-danger"></span>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Birthdate</label>
                          <DateInput name="birthDate" value={activeItem.birthDate} onChange={handleChange} />
                          <span className="text-danger"></span>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Tax Exemption Code</label>
                          <TextInput name="taxExemptionCode" value={activeItem.taxExemptionCode} onChange={handleChange} />
                        </div>
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
                    <input className="form-control" name="primaryPhone" value={activeItem.primaryPhone} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                    <span className="text-danger"></span>
                  </div>
                  <div className="mb-3">
                    <label className="form-label required">Secondary Phone</label>
                    <input className="form-control" name="secondaryPhone" value={activeItem.secondaryPhone} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                    <span className="text-danger"></span>
                  </div>
                  <div className="mb-3">
                    <label className="form-label required">Email Address</label>
                    <input className="form-control" name="emailAddress" value={activeItem.emailAddress} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                    <span className="text-danger"></span>
                  </div>
                  <div className="mb-3">
                    <label className="form-label required">Language</label>
                    <select className="form-select" name="language" value={activeItem.language} onChange={(event) => handleChange(event.target.name, event.target.value)}>
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
                        <input className="form-control" name="billing_line1" value={activeItem.billing_line1} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="mb-3">
                        <label className="form-label required">City</label>
                        <input className="form-control" name="billing_city" value={activeItem.billing_city} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label required">State</label>
                        <input className="form-control" name="billing_state" value={activeItem.billing_state} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label required">Zip Code</label>
                        <input className="form-control" name="billing_zip" value={activeItem.billing_zip} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label required">Country</label>
                        <SelectInput name="billing_country" value={activeItem.billing_country} emptyOption="No Country Selected" onChange={handleChange}>
                          {data.countries && data.countries.map((country) => {
                            return country.active ? <option key={country.iso2} value={country.iso2}>{country.name}</option> : <></>
                          })}
                        </SelectInput>
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
                        <input className="form-control" name="shipping_line1" value={activeItem.shipping_line1} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="mb-3">
                        <label className="form-label required">City</label>
                        <input className="form-control" name="shipping_city" value={activeItem.shipping_city} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label required">State</label>
                        <input className="form-control" name="shipping_state" value={activeItem.shipping_state} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label required">Zip Code</label>
                        <input className="form-control" name="shipping_zip" value={activeItem.shipping_zip} onChange={(event) => handleChange(event.target.name, event.target.value)} />
                        <span className="text-danger"></span>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label required">Country</label>
                        <SelectInput name="shipping_country" value={activeItem.shipping_country} emptyOption="No Country Selected" onChange={handleChange}>
                          {data.countries && data.countries.map((country) => {
                            return country.active ? <option key={country.iso2} value={country.iso2}>{country.name}</option> : <></>
                          })}
                        </SelectInput>
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
    <ChangeProfileImage customerId={params.customerId} showModal={showCrop} onHide={handleHideModal} onUpdate={handleUpdateModal} />
  </PageHeader>
}

export default EditCustomer;