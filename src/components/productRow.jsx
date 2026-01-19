import React from 'react';
import PropTypes from 'prop-types';

const ProductRow = ({ product, onAdditem, onRemoveItem, onViewDetail }) => {
    
    const handleAddCart = (e, id) => {
        e.preventDefault();
        if (onAdditem) onAdditem(id);
    };

    const handleRemoveItem = (e, id) =>{
        e.preventDefault();
        if (onRemoveItem) onRemoveItem(id);
    };

    const handleViewDetail = (e) => {
        e.preventDefault();
        if (onViewDetail) onViewDetail();
    };

    let price = product.prices?.find(el => el.priceType?.toUpperCase() == 'PRICE');
    let discount = product.prices?.find(el => el.priceType?.toUpperCase() == 'DISCOUNT');

    return <div className="col-md-12 col-xl-12">
        <div className="card shadow-0 border rounded-3">
        <div className="card-body">
            <div className="row">
            <div className="col-md-12 col-lg-3 col-xl-3 mb-4 mb-lg-0">
                <div className="bg-image hover-zoom ripple rounded ripple-surface">
                <img src="/images/noimage.jpg" className="w-100" onClick={handleViewDetail} />
                <a href="#!">
                    <div className="hover-overlay">
                    <div className="mask" style={{backgroundColor: 'rgba(253, 253, 253, 0.15)'}}></div>
                    </div>
                </a>
                </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-6">
                <h2>{product.name}</h2>
                <div className="mt-1 mb-0 text-muted small">
                <span>100% cotton</span>
                <span className="text-primary"> • </span>
                <span>Light weight</span>
                <span className="text-primary"> • </span>
                <span>Best finish<br /></span>
                </div>
                <div className="mb-2 text-muted small">
                <span>Unique design</span>
                <span className="text-primary"> • </span>
                <span>For men</span>
                <span className="text-primary"> • </span>
                <span>Casual<br /></span>
                </div>
                <p className="text-truncate mb-4 mb-md-0">
                There are many variations of passages of Lorem Ipsum available, but the
                majority have suffered alteration in some form, by injected humour, or
                randomised words which dont look even slightly believable. there are many variations of passages of Lorem Ipsum available, but the
                majority have suffered alteration in some form, by injected humour, or
                randomised words which dont look even slightly believable.
                </p>
            </div>
            <div className="col-md-6 col-lg-3 col-xl-3 border-sm-start-none border-start">
                <div className="d-flex flex-row align-items-center mb-1">
                <h4 className="mb-1 me-1">{price?.price.toLocaleString("en-US", { style: 'currency', currency: price?.priceCurrency ?? 'USD'})}</h4>
                <span className="text-danger"><s>{discount?.price.toLocaleString("en-US", { style: 'currency', currency: discount?.priceCurrency ?? 'USD'})}</s></span>
                </div>
                <h6 className="text-success"></h6>
                <div className="d-flex flex-column mt-4">
                {onViewDetail != undefined && <button className="btn btn-primary btn-sm" type="button" onClick={(e) => handleViewDetail(e, product.id)} >Details</button>}
                {onAdditem != undefined && <button className="btn btn-outline-primary btn-sm mt-2" type="button" onClick={(e) => handleAddCart(e, product.id)} >Add to cart</button>}
                {onRemoveItem != undefined && <button className="btn btn-outline-danger btn-sm mt-2" type="button" onClick={(e) => handleRemoveItem(e, product.id)} >Remove</button>}
                </div>
            </div>
            </div>
        </div>
        </div>
    </div>
} 

export default ProductRow;

ProductRow.propTypes = {
    product: PropTypes.object.isRequired,
    onAdditem: PropTypes.func,
    onRemoveItem: PropTypes.func,
    onViewDetail: PropTypes.func
}
