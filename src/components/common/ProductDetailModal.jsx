import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getProductUrl } from '../../utils/productUrl';

export const ProductDetailModal = () => {
  const { pdpProduct, setPdpProduct } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (pdpProduct) {
      navigate(getProductUrl(pdpProduct));
      window.scrollTo({ top: 0, behavior: 'instant' });
      setPdpProduct(null);
    }
  }, [pdpProduct, navigate, setPdpProduct]);

  return null;
};

export default ProductDetailModal;
