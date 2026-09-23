import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginUser } = useCart();

  useEffect(() => {
    const token = searchParams.get('token');
    const rawUser = searchParams.get('user');
    const redirectPath = searchParams.get('redirect') || '/account';
    const error = searchParams.get('error');

    if (error) {
      console.error('[Social Auth Callback Error]', error);
      navigate('/?error=' + encodeURIComponent(error));
      return;
    }

    if (token && rawUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(rawUser));
        loginUser(parsedUser, token);
        navigate(redirectPath);
      } catch (err) {
        console.error('Failed to parse user from OAuth callback:', err);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [searchParams, loginUser, navigate]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center pt-28 pb-16 bg-white font-serif">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs uppercase tracking-widest text-neutral-500">Authenticating Atelier Session...</p>
    </div>
  );
};

export default AuthCallback;
