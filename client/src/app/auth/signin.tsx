import React, { useState, useEffect } from 'react';
import { Button, Input } from '@heroui/react';
import fetchBase from '../../common/fetchBase';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import FloridaLogin from '../../assets/svg/florida-login';
import LeftHalfAnimation from '../components/animated_background';
import Park from '../../assets/svg/park';
import CarSignIn from '../../assets/svg/car-sign-in';
import { motion } from 'framer-motion';

const SignIn = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loadingSignin, setLoadingSignin] = useState<boolean>(false);
    const [signinError, setSigninError] = useState<string | null>(null);
    const [dots, setDots] = useState<{ top: string; left: string }[]>([]);
    const [redirectToDashboard, setRedirectToDashboard] = useState<boolean>(false);
    const [redirectToFinish, setRedirectToFinish] = useState<boolean>(false);

    // Generate dots only once
    useEffect(() => {
        const generatedDots = Array.from({ length: 900 }, () => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`
        }));
        setDots(generatedDots);
    }, []); // Empty dependency array ensures this runs only once

    const signIn = () => {
        fetch(fetchBase + "/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-GatorPool-Device-Id": localStorage.getItem("X-GatorPool-Device-Id"),
                "X-GatorPool-Username": email,
            },
            credentials: "include",
            body: JSON.stringify({
                grant_type: "password",
                username: email,
                password: password,
                scope: "internal"
            }),
        }).then(res => res.json()).then(data => {
            if(data.success) {
                localStorage.setItem("X-GatorPool-Username", email);
                // Handle successful login
                if(data.onboarding_redirect) {
                    setRedirectToFinish(true);
                } else {
                    setRedirectToDashboard(true);
                }
            } else {
                setSigninError(data.error);
            }
        }).catch(error => {
            setSigninError("Invalid email or password");
        });
    };

    if(redirectToDashboard) {
        return (
            <Navigate to="/dashboard" />
        );
    } else if(redirectToFinish) {
        return (
            <Navigate to="/auth/finish" />
        );
    } else {
        return(
            <div className="flex mobile:flex-col md:flex-row min-h-screen w-full light:bg-white dark:bg-black">
                {/* Left sign-in side */}
                <div className="relative flex flex-col py-10 mobile:px-12 xl:px-24 mobile:w-full md:w-1/2 border-r-1 light:border-neutral-400 dark:border-neutral-800 overflow-hidden">
          
                {/* Background Dots */}
                <div className="inset-0 pointer-events-none mobile:hidden md:block md:absolute">
                    {dots.map((dot, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-neutral-600 dark:bg-neutral-400 opacity-20 rounded-full"
                            style={{ top: dot.top, left: dot.left }}
                            initial={{ opacity: 0.1, scale: 1 }}
                            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
                            transition={{
                                duration: Math.random() * 4 + 2,
                                repeat: Infinity,
                                repeatType: "mirror",
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>
    
    
                {/* GatorPool Logo */}
                <div className="flex flex-row items-center z-10">
                    <img src={require("../../assets/images/logo.png")} alt="GatorPool Logo" className="w-20" />
                    <h1 className="text-xl text-black dark:text-white font-RobotoSemiBold text-left">
                    GatorPool
                    </h1>
                </div>
    
                {/* Left Animation Section */}
                {/* <LeftHalfAnimation /> */}
    
                {/* Florida Login Components */}
                <div className="flex md:hidden lg:block mobile:hidden md:block ml-auto z-10">
                    <FloridaLogin width="400" height="400" />
                </div>
    
                <div className="flex lg:hidden mt-auto mobile:hidden md:block items-center z-10">
                    <FloridaLogin width="300" height="400" />
                </div>
    
                {/* Car Sign-in Components */}
                <div className="flex lg:block mt-auto mobile:hidden items-center z-10">
                    <CarSignIn width="400" height="400" />
                </div>
    
                <div className="flex lg:hidden mt-auto mobile:hidden md:block items-center z-10">
                    <CarSignIn width="300" height="400" />
                </div>
    
                </div>
    
                {/* Right side of sign-in page */}
                <div className="flex flex-col mobile:w-full md:w-1/2 md:py-10 mobile:px-12 xl:px-24">
                    <p className="text-lg text-black dark:text-white font-RobotoBold md:mt-24 mobile:mb-12 md:mb-0">
                        Log into GatorPool
                    </p>
    
                    <Input 
                        type="email"
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mobile:w-full desktop2:w-8/12 md:mt-16 text-black dark:text-white" />
    
                    <Input 
                        type="password"
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mobile:w-full desktop2:w-8/12 mt-8 text-black dark:text-white" />
    
                    <Button
                        isLoading={loadingSignin}
                        className="mobile:w-full mt-8 desktop2:w-8/12 mt-8 text-white"
                        onPress={() => {
                            signIn();
                        }}
                        color="secondary"
                    >
                        Sign In
                    </Button>
                    
                    <div className="flex flex-col mt-8">
                        <p className="text-black dark:text-white font-RobotoRegular text-sm">
                            Don't have an account?
                        </p>
                        <Link to="/auth/signup" className="text-black dark:text-white underline font-RobotoBold text-sm">
                            Sign up
                        </Link>
                    </div>
                    
                    <div className="flex flex-col mt-auto">
                        <p className="text-black dark:text-white font-RobotoRegular text-sm">
                        By continuing, you agree to our <Link to="/terms" className="text-black dark:text-white underline font-RobotoBold text-sm">Terms of Service</Link> and <Link to="/privacy" className="text-black dark:text-white underline font-RobotoBold text-sm">Privacy Policy</Link>.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
};

export default SignIn;
