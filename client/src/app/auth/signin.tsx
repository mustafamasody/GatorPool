import React, { useState, useEffect } from 'react';
import { Button, Input, InputOtp } from '@heroui/react';
import fetchBase from '../../common/fetchBase';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import FloridaLogin from '../../assets/svg/florida-login';
import LeftHalfAnimation from '../components/animated_background';
import Park from '../../assets/svg/park';
import CarSignIn from '../../assets/svg/car-sign-in';
import { motion } from 'framer-motion';
import { EyeFilledIcon, EyeSlashFilledIcon } from '../../assets/svg/eye';
import logo from '../../assets/images/logo.png';
const SignIn = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loadingSignin, setLoadingSignin] = useState<boolean>(false);
    const [signinError, setSigninError] = useState<string | null>(null);
    const [dots, setDots] = useState<{ top: string; left: string }[]>([]);
    const [redirectToDashboard, setRedirectToDashboard] = useState<boolean>(false);
    const [redirectToFinish, setRedirectToFinish] = useState<boolean>(false);

    const [showPasswordReset, setShowPasswordReset] = useState<boolean>(false);
    const [passwordResetPage, setPasswordResetPage] = useState<number>(0);
    const [passwordResetEmailValue, setPasswordResetEmailValue] = useState<string>('');
    const [passwordResetCodeValue, setPasswordResetCodeValue] = useState<string>('');
    const [newPasswordValue, setNewPasswordValue] = useState<string>('');
    const [confirmPasswordValue, setConfirmPasswordValue] = useState<string>('');
    const [status, setStatus] = useState<string | null>(null);

    const [showMfa, setShowMfa] = useState<boolean>(false);
    const [mfaValue, setMfaValue] = useState<string>('');

    const [isPasswordVisible, setPasswordVisible] = useState<boolean>(false);

    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

    const toggleVisibility = () => {
      setPasswordVisible((prev) => !prev);
    }

    // Generate dots only once
    useEffect(() => {
        const generatedDots = Array.from({ length: 900 }, () => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`
        }));
        setDots(generatedDots);
    }, []); // Empty dependency array ensures this runs only once

    const signIn = () => {
        setLoadingSignin(true);
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
                scope: "internal",
                mfa_code: mfaValue,
            }),
        }).then(res => res.json()).then(data => {
            setLoadingSignin(false);
            if(data.success) {
                localStorage.setItem("X-GatorPool-Username", email);
                // Handle successful login
                if(data.onboarding_redirect) {
                    setRedirectToFinish(true);
                } else {
                    setRedirectToDashboard(true);
                }
            } else {
                if(data.error) {
                    if(data.error === "mfa_code_required" || data.error === "mfa_required") {
                      // Redirect to MFA page
                      setShowMfa(true);
                    } else {
                      setSigninError(data.error);
                    }
                  }
            }
        }).catch(error => {
            setSigninError("Invalid email or password");
        });
    };

    const sendPasswordResetCode = () => {
        fetch(fetchBase + "/v1/account/auth/password/reset/request", {
            method: 'POST', credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-GatorPool-Username': passwordResetEmailValue,
                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id')
            },
            body: JSON.stringify({
            })
        }).then(res => res.json()).then((data) => {
            if(data.success) {
                setPasswordResetPage(1);
            } else {
                if(data.error) {
                    if(data.error === "password reset request already exists") {
                        setStatus("A password reset request already exists. Please check your email.");
                    }
                }
            }
        });
    }

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
                    <img src={logo} alt="GatorPool Logo" className="w-20" />
                    <h1 className="text-xl text-black dark:text-white font-RobotoSemiBold text-left">
                    GatorPool
                    </h1>
                </div>
    
                {/* Left Animation Section */}
                {/* <LeftHalfAnimation /> */}
    
                {/* Florida Login Components */}
                <div className="flex md:hidden lg:block mobile:hidden md:block mt-auto z-10">
                    <FloridaLogin width="400" height="400" />
                </div>
    
                <div className="flex lg:hidden mt-auto mobile:hidden md:block items-center z-10">
                    <FloridaLogin width="300" height="400" />
                </div>
    
                {/* Car Sign-in Components */}
                {/* <div className="flex lg:block mt-auto mobile:hidden items-center z-10">
                    <CarSignIn width="400" height="400" />
                </div>
    
                <div className="flex lg:hidden mt-auto mobile:hidden md:block items-center z-10">
                    <CarSignIn width="300" height="400" />
                </div> */}
    
                </div>
    
                {/* Right side of sign-in page */}
                <div className="flex flex-col mobile:w-full md:w-1/2 md:py-10 mobile:px-12 xl:px-24">
                {
                    showPasswordReset && passwordResetPage === 0 ? (
                        <div className="flex flex-col w-full h-full">
                            <p className="text-lg text-black dark:text-white font-RobotoBold md:mt-24 mobile:mb-12 md:mb-0">
                                Reset your password
                            </p>
            
                            <Input 
                                type="email"
                                label="Email"
                                placeholder="Enter your email"
                                value={passwordResetEmailValue}
                                onChange={(e) => setPasswordResetEmailValue(e.target.value)}
                                className="mobile:w-full desktop2:w-8/12 md:mt-16 text-black dark:text-white" />
            
                            <Button
                                isLoading={loadingSignin}
                                className="mobile:w-full mt-8 desktop2:w-8/12 mt-8 text-white"
                                onPress={() => {
                                    sendPasswordResetCode();
                                }}
                                color="secondary"
                            >
                                Send Code
                            </Button>

                            {
                                status && (
                                    <div className="flex flex-col mt-2">
                                        <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                            {status}
                                        </p>
                                    </div>
                                )
                            }
                            
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
                    ) :
                    showPasswordReset && passwordResetPage === 1 ? (
                        <div className="flex flex-col w-full h-full">
                        <p className="text-lg text-black dark:text-white font-RobotoBold md:mt-24 mobile:mb-12 md:mb-0">
                            Reset your password
                        </p>
        
                        <InputOtp
                            value={passwordResetCodeValue}
                            onValueChange={setPasswordResetCodeValue}
                            className="light dark:dark text-black dark:text-white" length={6} />

                    <Button
                        onPress={() => {
                            setTimeout(() => {
                                fetch(fetchBase + "/v1/account/auth/password/reset/code", {
                                    method: 'POST', credentials: 'include',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-GatorPool-Username': passwordResetEmailValue,
                                        'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id')
                                    },
                                    body: JSON.stringify({
                                        code: passwordResetCodeValue,
                                    })
                                }).then(res => res.json()).then((data) => {
                                    if(data.success){
                                        setPasswordResetPage(2);
                                        setStatus('');
                                    } else {
                                        if(data.error === "send_back_err") {
                                            setStatus('');
                                            setShowMfa(false);
                                            setShowPasswordReset(false);
                                            setPasswordResetPage(0);
                                        } else {
                                            setStatus(data.error);
                                        }
                                    }
                                })
                            }, 300)
                        }}
                        color="primary" className=" text-white mx-auto font-PoppinsRegular w-full mt-6 py-2" size="md"  >
                            Verify
                        </Button>

                        {
                            status && (
                                <div className="flex flex-col mt-2">
                                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                        {status}
                                    </p>
                                </div>
                            )
                        }
                        
                        <div className="flex flex-col mt-auto">
                            <p className="text-black dark:text-white font-RobotoRegular text-sm">
                            By continuing, you agree to our <Link to="/terms" className="text-black dark:text-white underline font-RobotoBold text-sm">Terms of Service</Link> and <Link to="/privacy" className="text-black dark:text-white underline font-RobotoBold text-sm">Privacy Policy</Link>.
                            </p>
                        </div>
                    </div>
                    ) :
                    showPasswordReset && passwordResetPage === 2 ? (
                        <div className="flex flex-col w-full h-full">
                        <p className="text-lg text-black dark:text-white font-RobotoBold md:mt-24 mobile:mb-12 md:mb-0">
                            Reset your password
                        </p>
        
                        <Input
                            className="light dark:dark text-black mt-4 dark:text-white "
                            endContent={
                                <button
                                aria-label="toggle password visibility"
                                className="focus:outline-none"
                                type="button"
                                onClick={toggleVisibility}
                                >
                                {isPasswordVisible ? (
                                    <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                ) : (
                                    <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                )}
                                </button>
                            }
                            label="Password"
                            value={newPasswordValue}
                            onChange={(e) => setNewPasswordValue(e.target.value)}
                            placeholder="Enter your password"
                            type={isPasswordVisible ? "text" : "password"}
                            />

                            <Input
                            className="light dark:dark text-black mt-4 dark:text-white "
                            endContent={
                                <button
                                aria-label="toggle password visibility"
                                className="focus:outline-none"
                                type="button"
                                onClick={toggleVisibility}
                                >
                                {isPasswordVisible ? (
                                    <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                ) : (
                                    <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                )}
                                </button>
                            }
                            label="Confirm Password"
                            value={confirmPasswordValue}
                            onChange={(e) => setConfirmPasswordValue(e.target.value)}
                            placeholder="Confirm your new password"
                            type={isPasswordVisible ? "text" : "password"}
                            />

                            <Button
                                onPress={() => {
                                    setTimeout(() => {
                                        if(newPasswordValue !== confirmPasswordValue){
                                            setStatus('Passwords do not match');
                                            return;
                                        }

                                        fetch(fetchBase + "/v1/account/auth/password/reset", {
                                            method: 'POST', credentials: 'include',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-GatorPool-Username': passwordResetEmailValue,
                                                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id')
                                            },
                                            body: JSON.stringify({
                                                code: passwordResetCodeValue,
                                                password: newPasswordValue,
                                            })
                                        }).then(res => res.json()).then((data) => {
                                            if(data.success){
                                                setStatus('');
                                                setShowPasswordReset(false);
                                                setPasswordResetPage(0);
                                            } else {
                                                setStatus(data.error);
                                            }
                                        })
                                    }, 300)
                                }}
                                color="primary" className="text-white mx-auto font-PoppinsRegular w-full mt-6 py-2" size="md"  >
                                    Reset Password
                                </Button>

                                {
                                    status && (
                                        <p className="text-red-500 dark:text-red-500 text-sm mt-1 font-PoppinsRegular">
                                        {status}
                                        </p>
                                    )
                                }

                        {
                            status && (
                                <div className="flex flex-col mt-2">
                                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                        {status}
                                    </p>
                                </div>
                            )
                        }
                        
                        <div className="flex flex-col mt-auto">
                            <p className="text-black dark:text-white font-RobotoRegular text-sm">
                            By continuing, you agree to our <Link to="/terms" className="text-black dark:text-white underline font-RobotoBold text-sm">Terms of Service</Link> and <Link to="/privacy" className="text-black dark:text-white underline font-RobotoBold text-sm">Privacy Policy</Link>.
                            </p>
                        </div>
                    </div>
                    ) :
                    showMfa ? (
                        <div className="flex flex-col w-full h-full">
                        <p className="text-lg text-black dark:text-white font-RobotoBold md:mt-24 mobile:mb-12 md:mb-0">
                            Enter the code sent to your email
                        </p>
        
                        <InputOtp
                            value={mfaValue}
                            onValueChange={setMfaValue}
                            className="light dark:dark text-black dark:text-white" length={6} />

                        <Button
                            isLoading={isLoggingIn}
                            onPress={() => {
                                setTimeout(() => {
                                    setIsLoggingIn(true);
                                    fetch(fetchBase + "/oauth2/token", {
                                        method: 'POST', credentials: 'include',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'X-GatorPool-Username': email,
                                            'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id')
                                        },
                                        body: JSON.stringify({
                                            mfa_code: mfaValue,
                                            username: email,
                                            password: password,
                                            scope: "internal",
                                            grant_type: "password",
                                        })
                                    }).then(res => res.json()).then((data) => {
                                        if(data.success){
                                            localStorage.setItem('X-GatorPool-Username', email);
                                            setStatus(null);
                                            setIsLoggingIn(false);
                                            setRedirectToDashboard(true);
                                        } else {
                                            setIsLoggingIn(false);
                                            if(data.error === "send_back_err") {
                                                setStatus('');
                                                setShowMfa(false);
                                                
                                            } else {
                                                if(data.error === "mfa_attempts_exceeded") {
                                                    setStatus("You have exceeded the maximum number of attempts. Please try again later.");
                                                } else if(data.error === "mfa_expired") {
                                                    setStatus("The code has expired. Please try again.");
                                                } else if(data.error.includes("Invalid mfa code. You have")) {
                                                    setStatus(data.error);
                                                }
                                                // setFrontendAlerts(data.error);
                                            }
                                        }
                                    })                    
                                }, 300)
                            }}
                            color="primary" className=" text-white mx-auto font-PoppinsRegular w-full mt-6 py-2" size="md">
                                Sign in
                            </Button>

                            {
                                status && (
                                    <p className="text-red-500 dark:text-red-500 text-sm mt-1 font-PoppinsRegular">
                                    {status}
                                    </p>
                                )
                            }
                        
                        <div className="flex flex-col mt-auto">
                            <p className="text-black dark:text-white font-RobotoRegular text-sm">
                            By continuing, you agree to our <Link to="/terms" className="text-black dark:text-white underline font-RobotoBold text-sm">Terms of Service</Link> and <Link to="/privacy" className="text-black dark:text-white underline font-RobotoBold text-sm">Privacy Policy</Link>.
                            </p>
                        </div>
                    </div>
                    )
                    : (
                        <div className="flex flex-col w-full h-full">
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

                            <div className="flex flex-col mt-2">
                                <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                    <button
                                    onClick={() => {
                                        setShowPasswordReset(true);
                                        setPasswordResetPage(0);
                                    }}
                                    className="text-black dark:text-white underline font-RobotoBold text-sm">
                                        Forgot your password?
                                    </button>
                                </p>
                            </div>
                            
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
                    )
                }
                </div>
            </div>
        );
    }
};

export default SignIn;
