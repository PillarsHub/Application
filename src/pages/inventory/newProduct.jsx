import React, { useState } from 'react';
import PageHeader from "../../components/pageHeader";
import Editor from "../../components/editor";
import { SendRequest } from "../../hooks/usePost";

const NewProduct = () => {
    const [activeItem, setActiveItem] = useState('');

    const handleChange = (name, value) => {
        setActiveItem(values => ({...values, [name]: value}))
    }

    const handleSubmit = async e => {
        e.preventDefault();

        SendRequest("POST", '/api/v1/products', activeItem, (r) =>
        {
            window.location = `/Inventory/Products/${r.id}/General`;
        }, (error) =>
        {
            alert(error);
        });

    }

    return <PageHeader title="General" preTitle="Products">
        <div className="container-xl">
            <form className="card" onSubmit={handleSubmit} autoComplete="off">
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-3">
                            <div className="mb-3">
                                <label className="form-label">Product Id</label>
                                <input type="text" className="form-control" placeholder="{Generate Random Value}" name="id" onChange={(e) => handleChange(e.target.name, e.target.value)} />
                                <span className="text-danger"></span>
                            </div>
                        </div>
                        <div className="col-md-9">
                            <div className="mb-3">
                                <label className="form-label">Product Name</label>
                                <input type="text" className="form-control" placeholder="Name" name="name" onChange={(e) => handleChange(e.target.name, e.target.value)} />
                                <span className="text-danger"></span>
                            </div>
                        </div>
                        <div className="col-md-12">
                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <Editor value="" name="description" onChange={handleChange}/>
                                <span className="text-danger"></span>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Specifications</label>
                                <Editor value="" name="specifications" onChange={handleChange}/>
                                <span className="text-danger"></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-footer">
                    <button type="submit" className="btn btn-primary">
                        Save
                    </button>
                </div>
            </form>
        </div>
    </PageHeader>
}

export default NewProduct;