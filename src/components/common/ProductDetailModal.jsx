import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export const ProductDetailModal = () => {
  const { pdpProduct, setPdpProduct } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (pdpProduct) {
      const prodId = typeof pdpProduct === 'object' ? pdpProduct.id : pdpProduct;
      if (prodId) {
        navigate(`/product/${prodId}`);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      setPdpProduct(null);
    }
  }, [pdpProduct, navigate, setPdpProduct]);

  return null;
};

export default ProductDetailModal;
