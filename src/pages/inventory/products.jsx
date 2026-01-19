import React, { useState } from 'react';
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../components/pageHeader";
import DataLoading from "../../components/dataLoading";
import Pagination from '../../components/pagination';

var GET_DATA = gql`query($offset: Int!, $first: Int!, $search: String!) {
  products(offset: $offset, first: $first, search: $search) {
    id
    name
    imageUrl
    categories{
      name
    }
    prices
    {
      id
      price
      priceCurrency
      volume
      {
        volumeId
        volume
      }
    }
  }
  totalProducts
}`;

const Products = () => {
  const [searchText, setSearchText] = useState('');
  const { loading, error, data, variables, refetch } = useQuery(GET_DATA, {
    variables: { offset: 0, first: 10, search: '' },
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const handleSubmit = async e => {
    e.preventDefault();
    refetch({ search: searchText, offset: 0 });
  }

  return <PageHeader title="Products">
    <div className="container-xl">
      <div className="row row-cards">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body border-bottom py-3">
              <div className="row g-2 align-items-center">
                <div className="col-auto">
                  <a href="/inventory/products/new" className="btn btn-default">
                    Add Product
                  </a>
                </div>
                <div className="col">
                  <div className="w-100">
                    <form onSubmit={handleSubmit} autoComplete="off">
                      <div className="input-icon">
                        <input className="form-control" tabIndex="1" placeholder="Enter search term" onChange={e => setSearchText(e.target.value)} />
                        <span className="input-icon-addon">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="10" cy="10" r="7"></circle><line x1="21" y1="21" x2="15" y2="15"></line></svg>
                        </span>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table card-table table-vcenter text-nowrap datatable">
                <thead>
                  <tr>
                    <th className="text-center w-1"><i className="icon-people"></i></th>
                    <th>Product Id</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products && data.products.map((item) => {
                    return <tr key={item.id}>
                      <td className="text-center">
                      
                        <div className="avatar d-block">
                          <img src={item.imageUrl} className="" />
                        </div>
                      </td>
                      <td>
                        <div><a className="text-reset" href={`/inventory/products/${item.id}/general`}>{item.id}</a></div>
                      </td>
                      <td>
                        <div><a className="text-reset" href={`/inventory/products/${item.id}/general`}>{item.name}</a></div>
                      </td>
                      <td>
                        {item.categories.map((category) => {
                          return <span className="m-1" key={category.name} >{category.name}</span>
                        })}
                      </td>
                      <td>
                        <span className="status-icon bg-@product.StatusColor"></span> Enabled
                      </td>
                      <td>
                        {item.prices[0]?.price?.toLocaleString("en-US", { style: 'currency', currency: item.prices[0].priceCurrency ?? 'USD' })}
                      </td>
                    </tr>
                  })}

                </tbody>
              </table>
            </div>
            <div className="card-footer d-flex align-items-center">
              <Pagination variables={variables} refetch={refetch} total={data.totalProducts} />
            </div>
          </div>
        </div>
      </div>
    </div>

  </PageHeader>
}



export default Products;