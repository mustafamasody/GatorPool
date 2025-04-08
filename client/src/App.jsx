import logo from './logo.svg';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import HomePage from './main/home';
import {HeroUIProvider} from "@heroui/react";
import SignUp from './app/auth/signup.tsx';
import SignIn from './app/auth/signin.tsx';
import ViewProfile from './app/profile/profile';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocation } from 'react-router-dom';
import Verify from './app/auth/verify';
import FinishSignup from './app/auth/finish_signup';
import ProtectedRoute from './app/auth/auth_provider';
import ViewController from './app/view_controller';
import {addToast, ToastProvider} from "@heroui/toast";
import FeedDisplay from './app/rider/query/feed_display';

function App() {

    let deviceID = '';

    useEffect(() => {
      if(localStorage.getItem('X-GatorPool-Device-Id') !== null){
          if(localStorage.getItem('X-GatorPool-Device-Id') === '' || localStorage.getItem('X-GatorPool-Device-Id') === 'null') {
              const deviceID = uuidv4(); // Generate UUID
              localStorage.setItem('X-GatorPool-Device-Id', deviceID);
          } else {
              deviceID = localStorage.getItem('X-GatorPool-Device-Id');
          }
          deviceID = localStorage.getItem('X-GatorPool-Device-Id');
      }else if(localStorage.getItem('X-GatorPool-Device-Id') === null || localStorage.getItem('X-GatorPool-Device-Id') === undefined){

          const deviceID = uuidv4(); // Generate UUID
          localStorage.setItem('X-GatorPool-Device-Id', deviceID);
      }
  }, []); 

    return (
      <HeroUIProvider>
        <ToastProvider/>
          <div className="light:light dark:dark">
            <Routes>
                <Route path="/" element={<HomePage />} />
              <Route path="/auth/signup" element={<SignUp />} />
              <Route path="/auth/signin" element={<SignIn />} />
              <Route path="/auth/finish" element={<FinishSignup />} />
              <Route path="/verify" element={<Verify />} />

              <Route path="/profile" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/driver-apply" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/find-ride" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/find-ride/rider-flow" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/driver-application" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/create-trip" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/my-trips" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/drivertrip/:trip_uuid" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/ridertrip/requested/:trip_uuid" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/ridertrip/created/:trip_uuid" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/rider-flow/trips/" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />
              <Route path="/rider-flow/tripview/:trip_uuid" element={<ProtectedRoute><ViewController /></ProtectedRoute>} />

              
          </Routes>
        </div>
      </HeroUIProvider>
    );
}

export default App;
