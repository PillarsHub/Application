import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom"
import { Get } from "../../hooks/useFetch.js";
import { SendRequest } from "../../hooks/usePost.js";
import PageHeader from "../../components/pageHeader.jsx";
import ProductNav from "./productNav.jsx";
import MultiSelect from "../../components/muliselect.jsx"
import Switch from "../../components/switch.jsx"


const ProductData = () => {
    let params = useParams()
    const [activeItem, setActiveItem] = useState();
    const [taxClasses, setTaxClasses] = useState();
    const [categories, setCategories] = useState();

    const handleChange = (name, value) => {
        setActiveItem(values => ({...values, [name]: value}))
    }

    useEffect(() =>{
        Get(`/api/v1/products/${params.productId}`, (r) =>{
            setActiveItem(r);
        }, (error) =>{
            alert(error);
        })

        Get(`/api/v1/taxClasses`, (r) =>{
            setTaxClasses(r);
        }, (error) =>{
            alert(error);
        })

        Get(`/api/v1/categories`, (r) =>{
            setCategories(r);
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
        }, (error, msg) =>
        {
            alert(error + ' - ' + msg);
        });
    }

    return <PageHeader title="Data" preTitle="Products">
        <form className="container-xl" onSubmit={handleSubmit} autoComplete="off">
            <ProductNav productId={params.productId} />
            <div id="success" className="col-md-12" style={{display: "none"}}>
                <div className="alert alert-success" role="alert">
                    <h4 className="alert-title">Updated Successfully.</h4>
                    <div className="text-muted">Your product has been updated.</div>
                </div>
            </div>
            <div className="row row-deck row-cards">
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Details</h3>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Product Id</label>
                                <input type="text" className="form-control" disabled value={activeItem?.id} />
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Category</label>
                                <MultiSelect className="form-select" name="categoryIds" value={activeItem?.categoryIds} onChange={handleChange}>
                                    {categories && categories.map((category) =>{
                                        return <option key={category.Id} value={category.id}>{category.name}</option>
                                    })}
                                </MultiSelect>
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Sort Order</label>
                                <input type="text" className="form-control" name="displayIndex" value={activeItem?.displayIndex} onChange={(e) => handleChange(e.target.name, e.target.value)} />
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Image</label>
                                <input type="text" className="form-control" name="imageUrl" value={activeItem?.imageUrl} onChange={(e) => handleChange(e.target.name, e.target.value)} />
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <div className="divide-y">
                                    <label className="row">
                                        <span className="col">Requires Shipping</span>
                                        <span className="col-auto">
                                            <Switch name="requiresShipping" value={activeItem?.requiresShipping} onChange={handleChange} />
                                        </span>
                                    </label>
                                    <label className="row">
                                        <span className="col">Enabled</span>
                                        <span className="col-auto">
                                            <Switch name="enabled" value={activeItem?.enabled} onChange={handleChange} />
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Classifications</h3>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Out of Stock Status:</label>
                                <select className="form-select" name="outOfStockStatus" value={activeItem?.outOfStockStatus} onChange={(e) => handleChange(e.target.name, e.target.value)}>
                                    <option value="InStock">In Stock</option>
                                    <option value="OutOfStock">Out of Stock</option>
                                    <option value="PreOrder">Pre-Order</option>
                                </select>
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Tax Class:</label>
                                <select className="form-select" name="taxClassId" value={activeItem?.taxClassId} onChange={(e) => handleChange(e.target.name, e.target.value)}>
                                    {taxClasses && taxClasses.map((tax) =>{
                                        return <option key={tax.Id} value={tax.id}>{tax.id} - {tax.description}</option>
                                    })}
                                </select>
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Product Class:</label>
                                <select className="form-select" name="productClass" value={activeItem?.productClass} onChange={(e) => handleChange(e.target.name, e.target.value)}>
                                    <option value="P">Product</option>
                                    <option value="C">Component</option>
                                </select>
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Kit Level:</label>
                                <input type="number" className="form-control" name="kit" value={activeItem?.kit} onChange={(e) => handleChange(e.target.name, e.target.value)} />
                                <span className="text-danger"></span>
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label">UPC</label>
                                <input type="text" className="form-control" name="upc" value={activeItem?.upc} onChange={(e) => handleChange(e.target.name, e.target.value)}/>
                                <span className="text-danger"></span>
                                <small className="form-hint">Universal Product Code</small>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">MPN:</label>
                                <input type="text" className="form-control" name="mpn" value={activeItem?.mpn} onChange={(e) => handleChange(e.target.name, e.target.value)} />
                                <span className="text-danger"></span>
                                <small className="form-hint">Manufacturer Part Number</small>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">HS Code:</label>
                                <input type="text" className="form-control" name="hsCode" value={activeItem?.hsCode} onChange={handleChange} />
                                <span className="text-danger"></span>
                                <small className="form-hint">Harminization Code</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Dimensions</h3>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label required">Length:</label>
                                <input type="text" className="form-control" name="length" value={activeItem?.length} onChange={(e) => handleChange(e.target.name, e.target.value)}/>
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label required">Width:</label>
                                <input type="text" className="form-control" name="width" value={activeItem?.width} onChange={(e) => handleChange(e.target.name, e.target.value)}/>
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label required">Height:</label>
                                <input type="text" className="form-control" name="height" value={activeItem?.height} onChange={(e) => handleChange(e.target.name, e.target.value)}/>
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Length Class:</label>
                                <select className="form-select" name="lengthClass" value={activeItem?.lengthClass} onChange={(e) => handleChange(e.target.name, e.target.value)}>
                                    <option>Centimeter</option>
                                    <option>Millimeter</option>
                                    <option>Inch</option>
                                </select>
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label required">Weight:</label>
                                <input type="text" className="form-control" name="weight" value={activeItem?.weight} onChange={(e) => handleChange(e.target.name, e.target.value)} />
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Weight Class:</label>
                                <select className="form-select" name="weightClass" value={activeItem?.weightClass} onChange={(e) => handleChange(e.target.name, e.target.value)}>
                                    <option>Kilogram</option>
                                    <option>Pound</option>
                                    <option>Gram</option>
                                    <option>Ounce </option>
                                </select>
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Unit of Measure:</label>
                                <select className="form-select" name="unitOfMeasure" value={activeItem?.unitOfMeasure} onChange={(e) => handleChange(e.target.name, e.target.value)}>
                                    <option>Each</option>
                                    <option>Kilogram</option>
                                    <option>Pound</option>
                                    <option>Centimeter </option>
                                </select>
                                <span className="text-danger"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card mt-2">
                    <div className="card-footer">
                        <button type="submit" className="btn btn-primary">
                            Save
                        </button>
                    </div>
                </div>
            </div>

        </form>
    </PageHeader>
}

export default ProductData;