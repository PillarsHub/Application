import React from 'react';
import PropTypes from 'prop-types';
import { Link } from "react-router-dom";

const ProductNav = ({ productId }) => {
  return <div className="mb-2">
    <div className="navbar-expand-md">
      <div className="collapse navbar-collapse" id="navbar-menu">
        <div className="navbar navbar-light">
          <div className="container-xl">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link" to={`/inventory/products/${productId}/general`}>
                  <span className="nav-link-title">
                    General
                  </span>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={`/inventory/products/${productId}/data`}>
                  <span className="nav-link-title">
                    Data
                  </span>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={`/inventory/products/${productId}/pricing`}>
                  <span className="nav-link-title">
                    Pricing
                  </span>
                </Link>

              </li>
              {/* <li className="nav-item">
                                <Link className="nav-link" to={`/inventory/products/${productId}/variants`}>
                                    <span className="nav-link-title">
                                        Variants
                                    </span>
                                </Link>
                            </li> */}
              {/* <li className="nav-item dropdown">
                                <Link className="nav-link" to={`/inventory/products/${productId}/images`}>
                                    <span className="nav-link-title">
                                        Images
                                    </span>
                                </Link>
                            </li> */}
              {/* <li className="nav-item dropdown">
                                <Link className="nav-link" to={`/inventory/products/${productId}/bom`}>
                                    <span className="nav-link-title">
                                        Bill of Material
                                    </span>
                                </Link>
                            </li> */}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
}

export default ProductNav;

ProductNav.propTypes = {
  productId: PropTypes.string.isRequired
}