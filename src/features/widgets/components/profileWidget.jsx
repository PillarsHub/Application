import React from "react";
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import DataLoading from "../../../components/dataLoading";
import DataError from "../../../components/dataError";
import LocalDate from "../../../util/LocalDate";
import FormatPhoneNumber from "../../../util/phoneNumberFormatter";
import Avatar from '../../../components/avatar';
import StatusPill from '../../../pages/customers/statusPill.jsx';
import SocialMediaLink from "../../../components/socialMediaLink";

var GET_DATA = gql`query {
  countries{
    iso2
    name
  }
}`;

const ProfileWidget = ({ customer, widget }) => {
  const { loading, error, data } = useQuery(GET_DATA, {
    variables: { offset: 0, first: 10, nodeIds: [customer.id] },
  });

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} showHeader={false} />

  var pCompact = (widget?.settings?.['compact'] ?? false);
  var countries = data.countries.reduce((acc, country) => {
    acc[country.iso2.toLowerCase()] = country.name;
    return acc;
  }, {});




  if (pCompact) {
    let address =
      customer.addresses?.find(a => a.type?.toLowerCase() == "billing") ??
      (customer.addresses ? customer.addresses[0] : { line1: '' });

    return <>
      <div className="card-header">
        <div className="row w-100 g-2 align-items-center">
          <div className="col-auto">
            <Avatar className="me-2" name={customer.fullName} url={customer.profileImage} />
          </div>
          <div className="col">
            <h4 className="card-title m-0">
              <span>{customer.fullName}</span>
            </h4>
            <div className="text-muted">
              {customer.customerType?.name ?? 'Unknown'}
            </div>
          </div>
          <div className="col-auto">
            <StatusPill status={customer.status} />
          </div>
        </div>
      </div>
      <div className="card-body">
        <dl className="row">
          <dd className="col-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><rect x="4" y="5" width="16" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="4" y1="11" x2="20" y2="11" /><line x1="11" y1="15" x2="12" y2="15" /><line x1="12" y1="15" x2="12" y2="18" /></svg>
            Enroll date</dd>
          <dd className="col-7 text-end">
            <LocalDate dateString={customer.enrollDate} />
          </dd>
          <dd className="col-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3z" /></svg>
            Handle
          </dd>
          <dd className="col-7 text-end">{customer.webAlias ?? customer.id}</dd>
          {true && <>
            <dd className="col-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 5m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"></path><path d="M3 7l9 6l9 -6"></path></svg>
              Email</dd>
            <dd className="col-7 text-end">{customer.emailAddress}</dd>


            <dd className="col-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path><path d="M15 7a2 2 0 0 1 2 2"></path><path d="M15 3a6 6 0 0 1 6 6"></path></svg>
              Phone</dd>
            <dd className="col-7 text-end">{customer.phoneNumbers && customer.phoneNumbers.length > 0 && FormatPhoneNumber(customer.phoneNumbers[0].number)}</dd>

            <dd className="col-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 20l-3 -3h-2a3 3 0 0 1 -3 -3v-6a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-2l-3 3"></path><path d="M8 9l8 0"></path><path d="M8 13l6 0"></path></svg>
              Language</dd>
            <dd className="col-7 text-end">{customer.language}</dd>

            <dd className="col-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2"></path><line x1="12" y1="12" x2="12" y2="12.01"></line><path d="M3 13a20 20 0 0 0 18 0"></path></svg>
              Merchant</dd>
            <dd className="col-7 text-end">{customer.merchantId}</dd>

            <dd className="col-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12"></path><path d="M20 12v4h-4a2 2 0 0 1 0 -4h4"></path></svg>
              Payment Status</dd>
            <dd className="col-7 text-end">{status.earningsClass}</dd>

            <dd className="col-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="11" r="3"></circle><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path></svg>
              Address</dd>
            <dd className="col-7 text-end">
              <address>
                {address?.line1} {address?.line2} {address?.line3}<br />
                {address?.city}, {address?.stateCode} {address?.zip} <br />
                {countries[address?.countryCode?.toLowerCase()]}
              </address>
            </dd>
          </>}
        </dl>
      </div>
    </>
  } else {
    return <div className="card-body py-4 text-center">
      <Avatar name={customer.fullName} url={customer.profileImage} size="xl" block={false} />
      <h3 className="m-0 mb-1"><a href={`/Customers/${customer.id}/Summary`}>{customer.fullName}</a></h3>
      <div className="widget-muted">{customer.customerType?.name}</div>
      <div className="mt-3">
        <StatusPill status={customer.status} />
      </div>
      {customer.socialMedia && <>
        <div className="row g-2 justify-content-center">
          {customer.socialMedia.map((link) => {
            if (link.value) {
              return <div key={link.name} className="col-auto py-3">
                <SocialMediaLink socialMediaId={link.name} link={link.value} />
              </div>
            }
          })}
        </div>
      </>}
    </div>
  }

}

export default ProfileWidget;

ProfileWidget.propTypes = {
  customer: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired
}