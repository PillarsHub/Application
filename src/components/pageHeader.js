import React, { useState, Children } from 'react';
import PropTypes from 'prop-types';
import { GetScope } from "../features/authentication/hooks/useToken"
import AccountMenu from '../pages/accountMenu';
import AutoComplete from '../components/autocomplete'
import CustomerNav from '../pages/customers/customerNav';

const PageHeader = ({ preTitle, title, postTitle, children, breadcrumbs, onSearch, customerId, pageId, fluid = false }) => {
  const [searchText, setSearchText] = useState('');

  let header;
  let content = [];

  Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === CardHeader) {
      header = child;
    } else {
      content.push(child);
    }
  });

  const handleChange = (name, value) => {
    setSearchText(value);
    if (onSearch == undefined) {
      location = `/customers/${value}/summary`;
    } else {
      onSearch(value);
      setSearchText();
    }
  }

  const handleSubmit = async e => {
    e.preventDefault();
    alert(searchText);
    onSearch(searchText);
  }

  const continerClass = fluid ? 'container-fluid' : 'container-xl';

  return <>

    <header className="navbar navbar-expand navbar-light d-print-none">
      <div className={continerClass}>
        <div className="navbar-nav flex-row order-md-last d-none d-lg-flex">
          <div className="nav-item dropdown ">
            <AccountMenu />
          </div>
        </div>
        <div className={`${(GetScope() == undefined && customerId) ? 'flex-row d-lg-flex align-items-center justify-content-center w-100' : 'flex-row justify-content-center w-100'}`} id="navbar-menu">
          {GetScope() == undefined && customerId && <>
            <CustomerNav customerId={customerId} pageId={pageId} />
          </>}

          <div className={(GetScope() == undefined && customerId) ? 'ms-auto me-auto ms-lg-0 me-lg-0 pe-lg-3' : 'ms-auto me-auto'} style={{maxWidth: '600px'}}>
            <form onSubmit={handleSubmit} autoComplete="off">
              <AutoComplete name="search" placeholder="Search Team Members" value={searchText} showIcon={true} onChange={handleChange} />
            </form>
          </div>
        </div>
      </div>
    </header>


    <div className="page-wrapper">
      {title && <div className={continerClass}>
        <div className="page-header d-print-none">
          <div className="row g-3 align-items-center">
            <div className="col me-4">
              {breadcrumbs && <>
                <ol className="breadcrumb breadcrumb-arrows" aria-label="breadcrumbs">
                  {breadcrumbs.map((crumb) => {
                    return <li key={crumb.link} className="breadcrumb-item">
                      <a href={crumb.link}>{crumb.title}</a>
                    </li>
                  })}
                  {/* <li className="breadcrumb-item active" aria-current="page"><a href="#">Data</a></li> */}
                </ol>
              </>}
              {preTitle && <div className="page-pretitle">
                {preTitle}
              </div>}
              {title && <h2 className="page-title">
                <span className="text-truncate">{title}</span>
              </h2>}
              {postTitle && <div className="page-pretitle">
                {postTitle}
              </div>}
            </div>
            <div className="col-auto ms-auto d-print-none">
              {!!header && <header>{header}</header>}
            </div>
          </div>
        </div>
      </div>}
      <div className="page-body h-100">
        {content}
      </div>
    </div>
  </>
}

function CardHeader(props) {
  return <header>{props.children}</header>;
}

export default PageHeader;
export { CardHeader };

CardHeader.propTypes = {
  children: PropTypes.any
}

PageHeader.propTypes = {
  preTitle: PropTypes.string,
  title: PropTypes.string,
  postTitle: PropTypes.string,
  children: PropTypes.any.isRequired,
  onSearch: PropTypes.func,
  breadcrumbs: PropTypes.any,
  customerId: PropTypes.string,
  pageId: PropTypes.string,
  fluid: PropTypes.bool
}
