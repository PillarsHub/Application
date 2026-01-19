import React from "react";
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import PageHeader, { CardHeader } from "../../components/pageHeader.jsx";
import DataLoading from "../../components/dataLoading.jsx";
import Pagination from '../../components/pagination.jsx';
import ProductCard from "../../components/productCard.jsx";
import CartButton from "../../features/shopping/components/cartButton.jsx";
import useCart from "../../features/shopping/hooks/useCart.jsx";

var GET_DATA = gql`query ($offset: Int!, $first: Int!, $categoryIds: [String]!) {
  category: categories(idList: $categoryIds) {
    products(offset: $offset, first: $first) {
      id
      name
      prices {
        id
        priceType
        priceCurrency
        price
        volume {
          volume
          volumeId
        }
      }
    }
    totalProducts
  }
  categories {
    id
    name
    totalProducts
  }
}`;

const Shop = () => {
  let params = useParams()
  const { loading, error, data, variables, refetch } = useQuery(GET_DATA, {
    variables: { offset: 0, first: 6, categoryIds: [''], search: '' },
  });

  const { cart, addItem } = useCart(params.customerId);

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  let products = data.category[0]?.products;

  const handleSearch = (searchText) => {
    refetch({ search: searchText, offset: 0 });
  };

  const handleCategory = (e, id) => {
    e.preventDefault();
    refetch({ categoryIds: [id], offset: 0 });
  };

  const handleAddCart = (id) => {
    let item = products.find(el => el.id == id);
    addItem(item);
  };

  const handleViewDetail = () => {
  };

  let currentCategory = variables.categoryIds[0];

  return <>
      <PageHeader title="Products" customerId={params.customerId} onSearch={handleSearch}>
          <CardHeader>
              <CartButton cart={cart} />
          </CardHeader>
          <div className="container-xl">
              <div className="row g-4">
                  <div className="col-3">
                      <div className="subheader mb-2">Category</div>
                      <div className="list-group list-group-transparent mb-3">
                          {data.categories && data.categories.map((category) => {
                              return <button key={category.id} className={`list-group-item list-group-item-action d-flex align-items-center ${category.id == currentCategory ? 'active' : ''}`} onClick={(e) => handleCategory(e, category.id)}>
                                  {category.name}
                                  <small className="text-muted ms-auto">
                                    {category.totalProducts}
                                  </small>
                              </button>
                          })}
                      </div>
                  </div>
                  <div className="col-9">
                      <div className="row row-deck row-cards">
                          {products && products.map((product) => {
                              return <ProductCard key={product.id} product={product} onAddCart={handleAddCart} onViewDetail={handleViewDetail} />
                          })}
                      </div>
                      <div className="card-footer d-flex align-items-center mt-3">
                          <Pagination variables={variables} refetch={refetch} total={data.category[0]?.totalProducts} />
                      </div>
                  </div>
              </div>
          </div>
      </PageHeader>
  </>
}

export default Shop;