import React, { Children } from 'react';
import PropTypes from 'prop-types';

const PageHeader = ({ preTitle, title, postTitle, children, breadcrumbs, fluid = false }) => {
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

  const continerClass = fluid ? 'container-fluid' : 'container-xl';

  return <>
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
  breadcrumbs: PropTypes.any,
  fluid: PropTypes.bool
}
