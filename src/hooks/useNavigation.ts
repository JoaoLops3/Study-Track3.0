import { useNavigate } from 'react-router-dom';

export function useNavigation() {
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate('/login');
  };

  const goToDashboard = () => {
    navigate('/');
  };

  return {
    goToLogin,
    goToDashboard,
  };
} 