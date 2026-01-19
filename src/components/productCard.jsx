import React from 'react';
import PropTypes from 'prop-types';

const ProductCard = ({ product, onAddCart, onViewDetail }) => {
    
    const handleAddCart = (e, id) => {
        e.preventDefault();
        if (onAddCart) onAddCart(id);
    };

    const handleViewDetail = (e, id) => {
        e.preventDefault();
        if (onViewDetail) onViewDetail(id);
    };


    let price = product.prices?.find(el => el.priceType?.toUpperCase() == 'PRICE');
    let discount = product.prices?.find(el => el.priceType?.toUpperCase() == 'DISCOUNT');

    return <div className="col-md-6 col-lg-4 col-xl-4">
        <div className="card card-sm">
            <a href="#" className="d-block" onClick={(e) => handleViewDetail(e, product.id)} ><img src="/images/noimage.jpg" className="card-img-top" /></a>
            <div className="card-body">
                <h2 className="text-truncate mb-2">{product.name}</h2>
                
                <div className="col-md-6 col-lg-3 col-xl-3">
                    <div className="d-flex flex-row align-items-center mb-1">
                    <h4 className="mb-1 me-1">{price?.price.toLocaleString("en-US", { style: 'currency', currency: price?.priceCurrency ?? 'USD'})}</h4>
                    <span className="text-danger"><s>{discount?.price.toLocaleString("en-US", { style: 'currency', currency: discount?.priceCurrency ?? 'USD'})}</s></span>
                    </div>
                </div>
                
                {/* <div className="mt-1 mb-0 text-muted small">
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
                </div> */}

                <div className="row align-items-center">
                    <div className="col">
                        <button className="btn w-100" onClick={(e) => handleAddCart(e, product.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-shopping-cart-plus" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17h-11v-14h-2"></path><path d="M6 5l6 .429m7.138 6.573l-.143 1h-13"></path><path d="M15 6h6m-3 -3v6"></path></svg>
                            Add to cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
} 

export default ProductCard;

ProductCard.propTypes = {
    product: PropTypes.object.isRequired,
    onAddCart: PropTypes.func.isRequired,
    onViewDetail: PropTypes.func.isRequired
}
