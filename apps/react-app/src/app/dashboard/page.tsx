import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {/* Conteúdo do dashboard */}
    </div>
  );
} 