import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <h1 className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 leading-none">
        404
      </h1>
      <h2 className="text-xl font-bold text-slate-800">
        Page Not Found
      </h2>
      <p className="text-sm text-slate-500 max-w-md">
        The requested resource or route does not exist in the project management console.
      </p>
      <Button variant="primary" icon={Home} onClick={() => navigate('/')}>
        Return to Dashboard
      </Button>
    </div>
  );
};

export default NotFoundPage;

