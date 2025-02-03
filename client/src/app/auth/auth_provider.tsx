import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import fetchBase from '../../common/fetchBase';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading, true/false = loaded
  const deviceID = localStorage.getItem('X-GatorPool-Device-Id');
  const username = localStorage.getItem('X-GatorPool-Username');

  useEffect(() => {
    async function verifyToken() {
      try {
        const response = await fetch(fetchBase + "/v1/auth/verify", {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-GatorPool-Device-Id': deviceID,
            'X-GatorPool-Username': username,
          },
        });
        const data = await response.json();

        if (data.success && data.message !== "account_not_complete") {
          setIsAuthenticated(true);
        } else {
          // Attempt to refresh the token
          const refreshResponse = await fetch(fetchBase + "/oauth2/token", {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-GatorPool-Device-Id': deviceID,
              'X-GatorPool-Username': username,
            },
            body: JSON.stringify({
              username,
              grant_type: 'refresh',
              scope: 'internal',
            }),
          });
          const refreshData = await refreshResponse.json();

          if (refreshData.success) {

            setIsAuthenticated(true);

          } else {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        setIsAuthenticated(false);
      }
    }

    verifyToken();
  }, [deviceID, username]);

  if (isAuthenticated === null) {
    // Show a loading spinner while the token is being verified
    return <div className="flex flex-col h-screen bg-white dark:bg-black w-full items-center justify-center">
      <img src={require('../../assets/images/logo.png')} alt="GatorPool" className="w-32 h-32" />
    </div>;
  }

  if (!isAuthenticated) {
    // Redirect to the login page if the user is not authenticated
    return <Navigate to="/auth/signin" />;
  }

  return children; // Render the protected content if authenticated
}

export default ProtectedRoute;
