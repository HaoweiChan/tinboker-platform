import React from 'react';
import { GoogleLoginButton } from './GoogleLoginButton';

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ className, children }) => {
  return (
    <GoogleLoginButton className={className}>
      {children || '登入'}
    </GoogleLoginButton>
  );
};
