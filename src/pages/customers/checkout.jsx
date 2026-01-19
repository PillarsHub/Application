import React from "react-dom/client";
import { useParams } from "react-router-dom"
import PageHeader from "../../components/pageHeader.jsx";
import useCart from "../../features/shopping/hooks/useCart.jsx";
import ProductRow from "../../components/productRow.jsx";

const Checkout = () => {
  let params = useParams()
  const { cart, removeItem, processCart } = useCart(params.customerId);

  const handleSubmit = (e) => {
    e.preventDefault();

    processCart((item) =>{
      window.location = `/customers/${params.customerId}/Orders/${item.id}`;
    }, (error) => {
      alert('Error' + error);
    })
  };

  return <>
    <PageHeader title="Products" customerId={params.customerId}>
      <div className="container-xl">
        <div className="row g-4">
          <div className="col-sm-6 col-md-8 col-xl-9">
            <div className="row row-deck row-cards">
              {cart.products && cart.products.map((product) => {
                return <ProductRow key={product.id} product={product} onRemoveItem={removeItem} />
              })}
            </div>
            <div className="card-footer d-flex align-items-center">
            </div>
          </div>
          <div className="col-sm-6 col-md-4 col-xl-3">
            <div className="card mb-3 border shadow-0">
              <div className="card-body">
                <form>
                  <div className="form-group">
                    <label className="form-label">Have coupon?</label>
                    <div className="input-group">
                      <input type="text" className="form-control border" name="" placeholder="Coupon code" />
                      <button className="btn btn-outline-default">Apply</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
              
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <p className="mb-2">Cart total:</p>
                  <p className="mb-2">{cart?.subTotal?.toLocaleString("en-US", { style: 'currency', currency: cart?.priceCurrency ?? 'USD'})}</p>
                </div>
                {cart?.shipping > 0 && <div className="d-flex justify-content-between">
                  <p className="mb-2">Discount:</p>
                  <p className="mb-2 text-success">{cart?.discount?.toLocaleString("en-US", { style: 'currency', currency: cart?.priceCurrency ?? 'USD'})}</p>
                </div> }
                <div className="d-flex justify-content-between">
                  <p className="mb-2">Tax:</p>
                  <p className="mb-2">{cart?.tax?.toLocaleString("en-US", { style: 'currency', currency: cart?.priceCurrency ?? 'USD'})}</p>
                </div>
                {cart?.shipping > 0 && <div className="d-flex justify-content-between">
                  <p className="mb-2">Shipping:</p>
                  <p className="mb-2">{cart?.shipping?.toLocaleString("en-US", { style: 'currency', currency: cart?.priceCurrency ?? 'USD'})}</p>
                </div> }
                <hr />
                <div className="d-flex justify-content-between">
                  <p className="mb-2">Total price:</p>
                  <p className="mb-2 fw-bold">{cart?.total?.toLocaleString("en-US", { style: 'currency', currency: cart?.priceCurrency ?? 'USD'})}</p>
                </div>

                <div className="mt-3">
                  <button className="btn btn-success w-100 mb-2" onClick={handleSubmit} > Make Purchase </button>
                  <a href="shop" className="btn btn-ghost-default w-100 mt-2"> Back to shop </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>
  </>
}

export default Checkout;