import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function useNavigation() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const goToLogin = () => {
    navigate('/login');
  };

  const goToDashboard = () => {
    navigate('/');
  };

  return {
    currentPage,
    totalPages,
    setCurrentPage,
    setTotalPages,
    goToLogin,
    goToDashboard,
  };
} 