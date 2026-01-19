import React from 'react';
import PropTypes from 'prop-types';
import { Post } from '../../../hooks/usePost';

export default function useCart(customerId) {
    const getCart = () => {
        const cartString = sessionStorage.getItem(`cart_${customerId}`);
        const cart = JSON.parse(cartString);
        return cart ?? { count: 0, products:[] };
    };
    
    const [cart, setCart] = React.useState(getCart());
    const [counter, setCounter] = React.useState(0);
    const increment = () => setCounter(counter + 1);

    const addItem = (product) => {
        increment();
        setCart(cart => {
            cart.products.push(product);
            cart.count += 1;
            updateCartTotals(cart);
            sessionStorage.setItem(`cart_${customerId}`, JSON.stringify(cart));
            return cart;
        });
    };

    const removeItem = (productId) => {
        setCart(cart => {
            cart.products.forEach((el, idx, arr) => {
                if (el.id == productId)
                {
                    arr.splice(idx, 1);
                }
            });

            cart.count -= 1;
            updateCartTotals(cart);
            sessionStorage.setItem(`cart_${customerId}`, JSON.stringify(cart));
            return cart;
        });
        increment();
    };

    const processCart = (onSuccess, onError) => {
        
        let lineItems = cart.products.map((product) =>
        {
            let price = product.prices?.find(el => el.priceType?.toUpperCase() == 'PRICE');

            return {
                productId: product.id,
                description: product.name,
                price: price.price,
                quantity: 1,
                volume: price.volume
            };
        });
        
        const now = new Date();

        let order = {
            customerId: customerId,
            orderDate: now.toISOString(),
            invoiceDate: now.toISOString(),
            orderType: "Standard",
            subTotal: `${cart.subTotal}`,
            shipping: `${cart.shipping}`,
            tax: `${cart.tax}`,
            taxRate: `${cart.taxRate}`,
            total: `${cart.total}`,
            lineItems: lineItems
        };

        let volumes = {};

        lineItems.forEach(function(item){ 
            item.volume.forEach(function(v) {
              let oldValue = volumes[v.volumeId] ?? 0;
              volumes[v.volumeId] = oldValue + v.volume;
            });
        });
        
        alert(JSON.stringify(volumes));

        Post("/api/v1/orders", order, (d) => {

            Object.entries(volumes).forEach(function(entry){
                const [key, value] = entry;

                let source = {
                    nodeId: customerId,
                    sourceGroupId: key,
                    date: now.toISOString(),
                    value: value,
                    externalId: d.id
                };

                Post("/api/v1/sources", source, () => {}, onError);
            })

            clearCart();
            onSuccess(d);
        }, onError);
    };

    const clearCart = () => {
        let cart = { count: 0, priceCurrency: 'usd',  products: [] };
        updateCartTotals(cart);
        sessionStorage.setItem(`cart_${customerId}`, JSON.stringify(cart));
        setCart(cart);
    }

    return { increment, addItem, removeItem, clearCart, processCart, cart };
}

useCart.propTypes = {
    customerId: PropTypes.string.isRequired
}

function updateCartTotals(cart)
{
    cart.subTotal = 0;
    cart.products.forEach(el =>{
        let price = el.prices?.find(el => el.priceType?.toUpperCase() == 'PRICE');
        cart.subTotal += price.price;
    });

    cart.taxRate = 0;

    cart.discount = 0;
    cart.tax = Math.round((cart.subTotal * cart.taxRate) * 100) / 100;
    cart.shipping = 0;
    cart.total = cart.subTotal + cart.discount + cart.tax + cart.shipping;
}