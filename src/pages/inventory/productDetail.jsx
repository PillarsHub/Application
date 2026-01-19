import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom"
import { Get } from "../../hooks/useFetch.js";
import { SendRequest } from "../../hooks/usePost.js";
import PageHeader from "../../components/pageHeader.jsx";
import ProductNav from "./productNav.jsx";
import Editor from "../../components/editor.jsx";

const ProductDetail = () => {
    let params = useParams()
    const [activeItem, setActiveItem] = useState();

    const handleChange = (name, value) => {
        setActiveItem(values => ({...values, [name]: value}))
    }

    useEffect(() =>{
        Get(`/api/v1/products/${params.productId}`, (r) =>{
            setActiveItem(r);
        }, (error) =>{
            alert(error);
        })
    }, []);

    const handleSubmit = async e => {
        e.preventDefault();

        SendRequest("PUT", `/api/v1/products/${params.productId}`, activeItem, () =>
        {
            var success = document.getElementById('success');
            success.style.display = "block";
        }, (error) =>
        {
            alert(error);
        });
    }

    return <PageHeader title="General" preTitle="Products">
        <div className="container-xl">
            <ProductNav productId={params.productId}/>
            
            <div className="row row-cards">
                <div id="success" className="col-md-12" style={{display: "none"}}>
                    <div className="alert alert-success" role="alert">
                        <h4 className="alert-title">Updated Successfully.</h4>
                        <div className="text-muted">Your product has been updated.</div>
                    </div>
                </div>

                <div className="col-md-12">
                    <form className="card" onSubmit={handleSubmit} autoComplete="off"> 
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Product Name</label>
                                <input type="text" className="form-control" placeholder="Name" value={activeItem?.name} name="name" onChange={(e) => handleChange(e.target.name, e.target.value)} />
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <Editor value={activeItem?.description} name="description" onChange={handleChange}/>
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Specifications</label>
                                <Editor value={activeItem?.specifications} name="specifications" onChange={handleChange}/>
                                <span className="text-danger"></span>
                            </div>
                        </div>
                        <div className="card-footer">
                            <button type="submit" className="btn btn-primary">
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </PageHeader>
}

export default ProductDetail;