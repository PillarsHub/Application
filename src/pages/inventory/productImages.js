import React from "react-dom/client";
import { useParams } from "react-router-dom"
import PageHeader from "../../components/pageHeader";
import ProductNav from "./productNav";

const ProductImages = () => {
    let params = useParams()

    return <PageHeader title="Images" preTitle="Products">
        <div className="container-xl">
            <ProductNav productId={params.productId}/>
            <div className="container-xl">
                    <p>this is working</p>
            </div>
        </div>
    </PageHeader>
}

export default ProductImages;