import React, { useState, useEffect } from 'react'
import CarSignup from '../../assets/svg/car-signup';
import { Button, Input } from '@heroui/react';
import { Check, X, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import fetchBase from '../../common/fetchBase';
import logo from '../../assets/images/logo.png';

const SignUp = () => {

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [loadingSignup, setLoadingSignup] = useState<boolean>(false);

    const [errorStatusText, setErrorStatusText] = useState<string | null>(null);

    const [minimumEightMet, setMinimumEightMet] = useState<boolean>(false);
    const [oneLowercaseLetterMet, setOneLowercaseLetterMet] = useState<boolean>(false);
    const [oneUppercaseLetterMet, setOneUppercaseLetterMet] = useState<boolean>(false);
    const [oneSpecialCharacterMet, setOneSpecialCharacterMet] = useState<boolean>(false);
    const [oneNumberMet, setOneNumberMet] = useState<boolean>(false);

    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {

        const minimumEight = password.length >= 8;
        const oneLowercaseLetter = /[a-z]/.test(password);
        const oneUppercaseLetter = /[A-Z]/.test(password);
        const oneSpecialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
        const oneNumber = /[0-9]/.test(password);

        setMinimumEightMet(minimumEight);
        setOneLowercaseLetterMet(oneLowercaseLetter);
        setOneUppercaseLetterMet(oneUppercaseLetter);
        setOneSpecialCharacterMet(oneSpecialCharacter);
        setOneNumberMet(oneNumber);

    }, [password]);

    const createAccount = () => {
        setLoadingSignup(true);
        fetch(fetchBase + "/v1/account/auth/signup", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-GatorPool-Username': email,
                'X-GatorPool-Device-Id': localStorage.getItem("X-GatorPool-Device-Id")
            },
            body: JSON.stringify({
                password: password
            })
        }).then(res => res.json()).then(data => {
            setLoadingSignup(false);  // ui loading
            if(data.success) {
                setCurrentPage(2); 
            } else {
                setErrorStatusText(data.error);
            }
        }).catch(err => {
            setLoadingSignup(false);
            setErrorStatusText("An error occurred. Please try again later.");
        })
    }

    return (
        <div className="flex mobile:flex-col md:flex-row min-h-screen w-full light:bg-white dark:bg-black">

            <div className="flex flex-col py-10 mobile:px-12 xl:px-24 mobile:w-full md:w-1/2 border-r-1 light:border-neutral-400 dark:border-neutral-800">

                <div className="flex flex-row items-center ">
                    <img src={logo} alt="GatorPool Logo" className="w-20" />
                    <h1 className="text-xl text-black dark:text-white font-RobotoSemiBold text-left">GatorPool</h1>
                </div>

                <h1 className="text-7xl mt-24 text-black dark:text-white font-RobotoRegular text-left">Create your login</h1>
                
                <p className="text-md mt-12 text-black dark:text-white font-RobotoRegular text-left">
                    We'll need your UF email address, and a unique password. You'll use this login to access GatorPool next time.
                </p>

                <div className="flex lg:hidden mt-auto mobile:hidden md:block  items-center">
                    <CarSignup width="300" height="400" />
                </div>

                <div className="flex md:hidden lg:block mt-auto mobile:hidden md:block  items-center">
                    <CarSignup width="500" height="400" />
                </div>

            </div>

            {/* Right side div (pages) */}
            <div className="flex flex-col mobile:w-full md:w-1/2 md:py-10 mobile:px-12 xl:px-24">

                {/* Page 1 */}
                {
                    currentPage === 1 && (
                        <div className="flex flex-col w-full h-full">
                            <p className="text-lg mobile:hidden md:block  text-black dark:text-white font-RobotoBold mt-24">
                                Enter your UF email and create a password.
                            </p>

                            <Input 
                            type="email"
                            label="Email"
                            placeholder="Enter your UF email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mobile:w-full desktop2:w-8/12 md:mt-16 text-black dark:text-white" />

                            <Input 
                            type="password"
                            label="Password"
                            placeholder="Create your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mobile:w-full desktop2:w-8/12 mt-8 text-black dark:text-white" />

                            <div className="grid grid-cols-2 mobile:w-full desktop2:w-8/12 mobile:gap-0 xl:gap-4 mt-8 ">
                                <div className="flex items-center">
                                    {minimumEightMet ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                                    <p className="text-neutral-800 text-sm dark:text-neutral-200 ml-2">Minimum 8 characters</p>
                                </div>
                                <div className="flex items-center">
                                    {oneLowercaseLetterMet ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                                    <p className="text-neutral-800 text-sm dark:text-neutral-200 ml-2">One lowercase letter</p>
                                </div>
                                <div className="flex items-center">
                                    {oneUppercaseLetterMet ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                                    <p className="text-neutral-800 text-sm dark:text-neutral-200 ml-2">One uppercase letter</p>
                                </div>
                                <div className="flex items-center">
                                    {oneSpecialCharacterMet ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                                    <p className="text-neutral-800 text-sm dark:text-neutral-200 ml-2">One special character</p>
                                </div>
                                <div className="flex items-center">
                                    {oneNumberMet ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                                    <p className="text-neutral-800 text-sm dark:text-neutral-200 ml-2">One number</p>
                                </div>
                            </div>

                            <Button
                            isLoading={loadingSignup}
                            className="mobile:w-full mt-8 desktop2:w-8/12 mt-8 text-white"
                            onPress={() => {
                                createAccount();
                            }}
                            color="secondary"
                            >
                                Sign Up
                            </Button>

                            {
                                errorStatusText && (
                                    <div className="flex flex-col mt-4">
                                        <p className="text-red-500 font-RobotoRegular text-sm">
                                            {errorStatusText}
                                        </p>
                                    </div>
                                )
                            }

                            <div className="flex flex-col mt-10">
                                <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                    Already have an account?
                                </p>
                                <Link to="/auth/signin" className="text-black dark:text-white underline font-RobotoBold text-sm">
                                    Sign in
                                </Link>
                            </div>

                            <div className="flex flex-col mt-auto">
                                <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                    By continuing, you agree to our <Link to="/tos" className="text-black dark:text-white underline font-RobotoBold text-sm">Terms of Service</Link>.
                                </p>
                            </div>
                        </div>
                    )
                }

                {/* Page 2: 1-10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 80, 96 */}
                {
                    currentPage === 2 && (
                        <div className="flex flex-col w-full h-full items-start mt-16 md:mt-40">
                            <Mail className="text-green-500" size={100} />
                            <p className="text-xl text-center text-black dark:text-white font-RobotoBold mt-8">
                                Account created successfully!
                            </p>
                            <p className="text-sm text-left text-black dark:text-white font-RobotoRegular mt-2">
                                Please check your inbox at {email} to verify your email. Click the link provided in the email and fill out the rest of your profile.
                            </p>
                        </div>
                    )
                }
            </div>
        </div>
    );
}

export default SignUp