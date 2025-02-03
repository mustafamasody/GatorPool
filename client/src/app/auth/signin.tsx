import React, { useState, useEffect } from 'react'
import { Button, Input } from '@heroui/react';
import fetchBase from '../../common/fetchBase';
import { Link } from 'react-router-dom';


const SignIn = () => {

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loadingSignup, setLoadingSignup] = useState<boolean>(false);

    return(
        <div className="flex mobile:flex-col md:flex-row min-h-screen w-full light:bg-white dark:bg-black">
            {/* Left sign of sign in page */}
            <div className="flex flex-col py-10 mobile:px-12 xl:px-24 mobile:w-full md:w-1/2 border-r-1 light:border-neutral-400 dark:border-neutral-800">
                <div className="flex flex-row items-center ">
                    <img src={require("../../assets/images/logo.png")} alt="GatorPool Logo" className="w-20" />
                    <h1 className="text-xl text-black dark:text-white font-RobotoSemiBold text-left">GatorPool</h1>
                </div>
            </div>

            {/* Right side of sign in page */}
            <div className="flex flex-col mobile:w-full md:w-1/2 md:py-10 mobile:px-12 xl:px-24">
                <p className="text-lg mobile:hidden md:block text-black dark:text-white font-RobotoBold mt-24">
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
                    className="mobile:w-full desktop2:w-8/12 md:mt-8 text-black dark:text-white" />

                <Button
                    isLoading={loadingSignup}
                    className="mobile:w-full mt-8 desktop2:w-8/12 mt-8 text-white"
                    onPress={() => {
                        
                    }}
                    color="secondary"
                    >
                        Sign Up
                </Button>
                
                <div className="flex flex-col mt-10">
                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                        Don't have an account?
                    </p>
                    <Link to="/signup" className="text-black dark:text-white underline font-RobotoBold text-sm">
                        Sign up
                    </Link>
                </div>
                
                <div className="flex flex-col mt-auto">
                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                        This site is protected by our <Link to="/terms" className="text-black dark:text-white underline font-RobotoBold text-sm">Terms of Service</Link> and <Link to="/privacy" className="text-black dark:text-white underline font-RobotoBold text-sm">Privacy Policy</Link>.
                    </p>
                </div>


            </div>

        </div>
    );
};

export default SignIn