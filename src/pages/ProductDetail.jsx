import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../data/mockProducts';
import { useCart } from '../context/CartContext';
import { productApi } from '../services/productApi';
import { Home } from './Home';

export const ProductDetail = () => {
  const { id } = useParams();
  const { setPdpProduct } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    if (id) {
      productApi.getProductById(id)
        .then((product) => {
          if (isMounted && product) {
            setPdpProduct(product);
            navigate('/', { replace: true });
          }
        })
        .catch(() => {
          const fallback =
            BEST_SELLERS_PRODUCTS.find((p) => p.id === id) ||
            MOCK_PRODUCTS?.find((p) => p.id === id) ||
            BEST_SELLERS_PRODUCTS[0];
          if (isMounted && fallback) {
            setPdpProduct(fallback);
            navigate('/', { replace: true });
          }
        });
    }
    return () => { isMounted = false; };
  }, [id, setPdpProduct, navigate]);

  return <Home />;
};
