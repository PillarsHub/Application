import React from "react-dom/client";
import { useParams } from "react-router-dom"
import PageHeader from "../../components/pageHeader.jsx";
import ProductNav from "./productNav.jsx";


const ProductBom = () => {
  let params = useParams()

  return <PageHeader title="Bill of Materials" preTitle="Products">
    <div className="container-xl">
      <ProductNav productId={params.productId} />
      <div className="container-xl">
        <p>this is working</p>
      </div>
    </div>
  </PageHeader>
}

export default ProductBom;