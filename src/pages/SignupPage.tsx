
import React from 'react';
import { Link } from 'react-router-dom';

const SignupPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        <p className="text-center mb-4">This is a placeholder for the signup page.</p>
        <div className="text-center mt-4">
          <Link to="/login" className="text-blue-600 hover:underline">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
