import React, { useState, useEffect } from 'react'
import CarSignup from '../../assets/svg/car-signup';
import { Button, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { Check, X, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import fetchBase from '../../common/fetchBase';

const FinishSignup = () => {

    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");

    const [ufid, setUfid] = useState<string>("");
    const [gender, setGender] = useState<string>("");

    const [isLoadingSaveProfile, setIsLoadingSaveProfile] = useState<boolean>(false);
    const [errorSavingProfile, setErrorSavingProfile] = useState<string | null>(null);

    useEffect(() => {

        fetch(fetchBase + "/v1/auth/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-GatorPool-Device-Id": localStorage.getItem("X-GatorPool-Device-Id"),
                "X-GatorPool-Username": localStorage.getItem("X-GatorPool-Username"),
            },
            credentials: "include",
            body: JSON.stringify({})
        }).then(res => res.json()).then(data => {
            if(!data.success) {
                window.location.href = "/auth/signin";
            }
        }).catch(error => {
            window.location.href = "/auth/signin";
        })

    }, []);

    const saveAccount = () => {
        setIsLoadingSaveProfile(true);
        fetch(fetchBase + "/v1/account/auth/finish", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-GatorPool-Device-Id": localStorage.getItem("X-GatorPool-Device-Id"),
                "X-GatorPool-Username": localStorage.getItem("X-GatorPool-Username"),
            },
            credentials: "include",
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                ufid: ufid,
                gender: gender,
            })
        }).then(res => res.json()).then(data => {
            setIsLoadingSaveProfile(false);
            if(data.success) {
                window.location.href = "/dashboard";
            } else {
                setErrorSavingProfile(data.error);
            }
        }).catch(err => {
            setErrorSavingProfile("An error occurred while saving your profile. Please try again later.");
        })
    };

    return (
        <div className="flex mobile:flex-col md:flex-row min-h-screen w-full light:bg-white dark:bg-black">

            <div className="flex flex-col py-10 mobile:px-12 xl:px-24 mobile:w-full md:w-1/2 border-r-1 light:border-neutral-400 dark:border-neutral-800">

                <div className="flex flex-row items-center ">
                    <img src={require("../../assets/images/logo.png")} alt="GatorPool Logo" className="w-20" />
                    <h1 className="text-xl text-black dark:text-white font-RobotoSemiBold text-left">GatorPool</h1>
                </div>

                <h1 className="text-7xl mt-24 text-black dark:text-white font-RobotoRegular text-left">Finish your profile</h1>
                
                <p className="text-md mt-12 text-black dark:text-white font-RobotoRegular text-left">
                    We'll need your full name as it appears on your government ID, your UFID, and gender.
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

                <div className="flex flex-col w-full h-full">
                    <p className="text-lg mobile:hidden md:block  text-black dark:text-white font-RobotoBold mt-24">
                        Enter some more details to finish your profile.
                    </p>

                    <div className="flex flex-col md:mt-16 mobile:space-y-4 items-center md:space-y-0 md:flex-row md:space-x-4 lg:space-x-8">
                      <Input 
                      type="text"
                      label="First Name"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mobile:w-full desktop2:w-8/12 text-black dark:text-white" />

                    <Input 
                      type="text"
                      label="Last Name"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mobile:w-full desktop2:w-8/12 text-black dark:text-white" />
                    </div>

                    <Input 
                      type="text"
                      label="UFID"
                      placeholder="Enter your UFID"
                      value={ufid}
                      onChange={(e) => setUfid(e.target.value)}
                      className="mobile:w-full mt-8 desktop2:w-8/12 text-black dark:text-white" />
                    <p className="text-sm mt-1 ml-2 text-black dark:text-white font-RobotoRegular text-left">
                        We require your UFID for safety purposes and regulation.
                    </p>

                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant="bordered" className="w-44 mt-8">
                                {
                                    gender === "" ? "Select Gender" : gender.charAt(0).toUpperCase() + gender.slice(1)
                                }
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu className="" color="primary" aria-label="Action event example" onAction={(key: string) => {
                            setGender(key);
                        }}>
                            <DropdownItem className="dark" key="male">Male</DropdownItem>
                            <DropdownItem key="female">Female</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                    <p className="text-sm mt-1 ml-2 text-black dark:text-white font-RobotoRegular text-left">
                        Gender is required for safety purposes and regulation.
                    </p>

                    <Button
                    isLoading={isLoadingSaveProfile}
                    className="mobile:w-full mt-8 desktop2:w-8/12 mt-8 text-white"
                    onPress={() => {
                        saveAccount();
                    }}
                    color="secondary"
                    >
                        Save Profile
                    </Button>

                    {
                        errorSavingProfile ? (
                            <div className="flex flex-row items-center mt-4">
                                <X size={24} className="text-red-500" />
                                <p className="text-sm ml-2 text-red-500 font-RobotoRegular">{errorSavingProfile}</p>
                            </div>
                        ) : null
                    }
                </div>
            </div>
        </div>
    );
}

export default FinishSignup