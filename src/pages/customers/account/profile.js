import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../../components/pageHeader";
import AccountNav from "./accountNav";
import Avatar from "../../../components/avatar";
import DataLoading from "../../../components/dataLoading";
import TextInput from "../../../components/textInput";
import LocalDate from "../../../util/LocalDate";
import SocialMediaIcon, { SocialMediaPlatforms } from "../../../components/socialMediaIcon";
import { SendRequest } from "../../../hooks/usePost";
import ChangeProfileImage from "./changeProfileImage";

import { WidgetTypes } from "../../../features/widgets/hooks/useWidgets";
import Widget from "../../../features/widgets/components/widget";

var GET_CUSTOMER = gql`query ($nodeIds: [String]!) {
  customers(idList: $nodeIds) {
    id
    fullName
    firstName
    lastName
    emailAddress
    enrollDate
    webAlias
    profileImage
    customerType {
      name
    }
    socialMedia
    {
      name,
      value
    }
    user {
      id
      username
      firstName
      lastName
      verified
      scope
    }
  }
  trees {
    id
    enableCustomerLegPreference
  }
}`;

const CustomerProfile = () => {
  let params = useParams()
  const [customer, setCustomer] = useState({});
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState();
  const [showCrop, setShowCrop] = useState();

  const { loading, error, data, refetch } = useQuery(GET_CUSTOMER, {
    variables: { nodeIds: [params.customerId] },
  });

  useEffect(() => {
    if (data) {
      let customer = data?.customers[0] ?? {};
      setCustomer(customer);
    }
  }, [data])

  if (loading) return <DataLoading />
  if (error) return `Error! ${error}`;

  let user = data?.customers[0].user;

  const handleHideModal = () => setShowCrop(false);
  const handleShowModal = () => setShowCrop(true);
  const handleUpdateModal = () => {
    refetch();
    setShowCrop(false);
  }

  const handleCustomerChange = (name, value) => {
    setCustomer((prevCustomer) => ({ ...prevCustomer, [name]: value }))
  }

  const handleMediaChange = (name, value) => {
    setCustomer((prevCustomer) => {
      const socialMediaArray = prevCustomer.socialMedia || []; // Initialize as an empty array if null
      const socialMediaIndex = socialMediaArray.findIndex(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      );

      const updatedSocialMedia = Array.isArray(socialMediaArray) ? [...socialMediaArray] : []; // Ensure socialMediaArray is an array

      if (socialMediaIndex !== -1) {
        // Update existing item
        updatedSocialMedia[socialMediaIndex] = { name, value };
      } else {
        // Add new item
        updatedSocialMedia.push({ name, value });
      }

      return {
        ...prevCustomer,
        socialMedia: updatedSocialMedia,
      };
    });
  };

  const handleSave = () => {
    setSaved(false);
    setSaveError();

    let item = [{
      op: "replace",
      path: "/firstName",
      value: customer.firstName
    }, {
      op: "replace",
      path: "/lastName",
      value: customer.lastName
    }, {
      op: "replace",
      path: "/socialMedia",
      value: customer.socialMedia
    }];

    SendRequest("PATCH", `/api/v1/Customers/${params.customerId}`, item, () => {
      setSaved(true);
    }, (error) => {
      setSaveError(error);
    })
  }

  return <PageHeader preTitle="Account" title={customer?.fullName} pageId="account" customerId={params.customerId}>
    <AccountNav pageId="profile" loading={loading} customerId={params.customerId} treeData={data?.trees} >
      <div className="card-body">
        <div className="e-profile">
          <div className="row">
            <div className="col-12 col-sm-auto mb-3">
              <div className="mx-auto" style={{ width: '140px' }}>
                <div className="d-flex justify-content-center align-items-center rounded" style={{ height: '140px', backgroundColor: 'rgb(233, 236, 239)' }}>
                  <Avatar name={`${customer?.firstName} ${customer?.lastName}`} size="xl" url={customer?.profileImage} />
                </div>
              </div>
            </div>
            <div className="col d-flex flex-column flex-sm-row justify-content-between mb-3">
              <div className="text-sm-left mb-2 mb-sm-0">
                <h2 className="pt-sm-2 pb-1 mb-0 text-nowrap">{data?.customers[0].firstName} {data?.customers[0].lastName}</h2>
                <p className="mb-0">{user?.username ?? customer?.emailAddress}</p>
                <div className="text-muted"><small>Joined <LocalDate dateString={customer?.enrollDate} hideTime={true} /></small></div>
                <div className="mt-2">
                  <button className="btn btn-primary" type="button" onClick={handleShowModal}>
                    <i className="fa fa-fw fa-camera"></i>
                    <span>Change Photo</span>
                  </button>
                </div>
              </div>
              <div className="text-center text-sm-right">
                <span className="badge badge-secondary">{customer?.customerType?.name}</span>
              </div>
            </div>
          </div>



          <div className="row">
            <div className="col">
              <div className="mb-3">
                <label className="form-label">First Name</label>
                <TextInput name="firstName" value={customer?.firstName} onChange={handleCustomerChange} />
              </div>
            </div>
            <div className="col">
              <div className="mb-3">
                <label className="form-label">Last Name</label>
                <TextInput name="lastName" value={customer?.lastName} onChange={handleCustomerChange} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-header">
        <span className="card-title">Social Media</span>
      </div>
      <div className="card-body">
        <div className="row">
          {SocialMediaPlatforms.map((platform) => {
            return <div key={platform.name} className="col-md-6">
              <div className="mb-3">
                <div className="input-group mb-2">
                  <span className="input-group-text">
                    <SocialMediaIcon socialMediaId={platform.name} />
                  </span>
                  <TextInput name={platform.name} value={customer.socialMedia?.find(item => item.name.toLowerCase() === platform.name.toLowerCase())?.value} placeholder={platform.placeholder} onChange={handleMediaChange} />
                </div>
              </div>
            </div>
          })}
        </div>
        {customer.socialMedia && customer.socialMedia.some(item => item.value) && <Widget widget={{ type: WidgetTypes.SocialLinks }} customer={customer} />}
      </div>
      <div className="card-footer bg-transparent">
        {saved && <div id="passwordSuccess" className="alert alert-success" role="alert">
          Your profile has been upated!
        </div>}
        {saveError && <div id="passwordSuccess" className="alert alert-danger" role="alert">
          {saveError}
        </div>}
        <div className="col d-flex justify-content-end">
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>

      <ChangeProfileImage customerId={params.customerId} showModal={showCrop} onHide={handleHideModal} onUpdate={handleUpdateModal} />

    </AccountNav>
  </PageHeader>
}

export default CustomerProfile;