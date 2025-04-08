import React, { useState, useEffect } from 'react';
import { AccountData } from '../../view_controller';
import { Button, Input } from '@heroui/react';
import {DatePicker} from "@heroui/react";
import {parseDate, getLocalTimeZone} from "@internationalized/date";
import fetchBase from '../../../common/fetchBase';
import social from '../../../assets/images/social.png';

interface DashboardProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const DriverApply: React.FC<DashboardProps> = ({ accountData, setAccountData }) => {

    // Driver Profile
    const [firstName, setFirstName] = useState<string>(accountData?.first_name);
    const [lastName, setLastName] = useState<string>(accountData?.last_name);
    const [email, setEmail] = useState<string>(accountData?.email);
    const [phone, setPhone] = useState<string>("");
    const [dob, setDob] = useState(parseDate("2024-04-04"));
    const [address, setAddress] = useState<string>("");
    const [addressLine2, setAddressLine2] = useState<string>("");
    const [city, setCity] = useState<string>("");
    const [state, setState] = useState<string>("");
    const [zip, setZip] = useState<string>("");

    // Vehicle
    const [make, setMake] = useState<string>("");
    const [model, setModel] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const [color, setColor] = useState<string>("");
    const [licensePlate, setLicensePlate] = useState<string>("");
    const [licenseState, setLicenseState] = useState<string>("");
    const [seats, setSeats] = useState<string>("");
    const [lugroom, setLugroom] = useState<string>("");

    const [currentPage, setCurrentPage] = useState<number>(1);

    return (
        <div className="flex flex-col space-y- bg-white dark:bg-black min-h-screen p-8">
            <h1 className="text-black dark:text-white text-2xl font-RobotoSemiBold">Apply to become a driver</h1>

            <div className="flex flex-col lg:flex-row w-full mt-16">
                <div className="flex flex-col h-[40rem] w-full lg:w-1/2 h-full">
                    {
                        currentPage === 1 && (
                            <div className="flex flex-col w-full h-full">
                                <h1 className="text-black dark:text-white text-xl font-RobotoSemiBold">Basic Information</h1>

                                <h1 className="text-black dark:text-white text-md mb-1 font-RobotoRegular">Enter your details as it appears on your government ID.</h1>
                                <div className="flex flex-row w-full mt-4 space-x-4 items-center">
                                    <Input 
                                            type="name"
                                            label="First Name"
                                            placeholder="Enter your first name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="mobile:w-full   text-black dark:text-white" />
                                    <Input 
                                        type="name"
                                        label="Last Name"
                                        placeholder="Enter your last name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="mobile:w-full   text-black dark:text-white" />
                                </div>

                                <div className="flex flex-row w-full space-x-4 items-center">
                                <Input 
                                        type="email"
                                        label="Email"
                                        disabled
                                        value={email}
                                        placeholder="Enter your email"
                                        className="mobile:w-full mt-4   text-black dark:text-white" />

                                <Input 
                                        type="text"
                                        label="Phone Number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter phone number (XXX-XXX-XXXX)"
                                        className="mobile:w-full mt-4   text-black dark:text-white" />
                                </div>

                                <h1 className="text-black dark:text-white text-xl mt-10 font-RobotoSemiBold">Legal Information</h1>
                                <h1 className="text-black dark:text-white text-md mt- mb-4 font-RobotoRegular">Federal and state law requires drivers of any digitalized ridesharing platform to be of at least 18 years of age.</h1>

                                <DatePicker
                                    className="max-w-[284px] light dark:dark"
                                    label="Date of Birth"
                                    value={dob}
                                    onChange={setDob}
                                />

                                <Input 
                                type="text"
                                label="Address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter your address"
                                className="mobile:w-full mt-4   text-black dark:text-white" />

                                <Input 
                                type="text"
                                label="Address Line 2"
                                value={addressLine2}
                                onChange={(e) => setAddressLine2(e.target.value)}
                                placeholder="Enter your address (optional)"
                                className="mobile:w-full mt-4   text-black dark:text-white" />

                                <div className="flex flex-row w-full space-x-4 items-center">
                                <Input 
                                        type="text"
                                        label="City"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Enter your city"
                                        className="mobile:w-full mt-4   text-black dark:text-white" />

                                <Input 
                                        type="text"
                                        label="State"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        placeholder="Enter your state"
                                        className="mobile:w-full mt-4   text-black dark:text-white" />

                                <Input 
                                        type="text"
                                        label="Zip"
                                        value={zip}
                                        onChange={(e) => setZip(e.target.value)}
                                        placeholder="Enter zip code"
                                        className="mobile:w-full mt-4   text-black dark:text-white" />
                                </div>
                            </div>
                        )
                    }

                    {
                        currentPage === 1 && (
                            <div className="flex flex-row mt-4 items-center space-x-4 ml-auto mt-">
                                <Button
                                    onClick={() => setCurrentPage(2)}
                                    className="bg-green-600 hover:bg-green-500 text-white dark:bg-gator-translucent p-4 rounded-full">
                                    Next
                                </Button>
                            </div>
                        )
                    }

                    {
                        currentPage === 2 && (
                            <div className="flex flex-col w-full h-full">
                                <h1 className="text-black dark:text-white text-xl font-RobotoSemiBold">Vehicle Information</h1>

                                <h1 className="text-black dark:text-white text-md mb-1 font-RobotoRegular">Enter the details for the vehicle you will primarily be using to host trips.</h1>
                                <div className="flex flex-row w-full mt-4 space-x-4 items-center">
                                    <Input 
                                            type="text"
                                            label="Make"
                                            placeholder="Make of vehicle"
                                            value={make}
                                            onChange={(e) => setMake(e.target.value)}
                                            className="mobile:w-full   text-black dark:text-white" />
                                    <Input 
                                        type="text"
                                        label="Model"
                                        placeholder="Model of vehicle"
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        className="mobile:w-full   text-black dark:text-white" />
                                </div>

                                <div className="flex flex-row w-full space-x-4 items-center">
                                <Input 
                                        type="text"
                                        label="Year"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        placeholder="Model year"
                                        className="mobile:w-full mt-4   text-black dark:text-white" />

                                <Input 
                                        type="text"
                                        label="Color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        placeholder="Color of vehicle"
                                        className="mobile:w-full mt-4   text-black dark:text-white" />
                                </div>

                                <div className="flex flex-row w-full space-x-4">
                                <Input 
                                        type="number"
                                        label="Seats"
                                        value={seats}
                                        onChange={(e) => setSeats(e.target.value)}
                                        placeholder="Number of seats"
                                        className="mobile:w-full mt-4   text-black dark:text-white" />

                                <div className="flex flex-col w-full">
                                <Input 
                                        type="number"
                                        label="Lugroom"
                                        value={lugroom}
                                        onChange={(e) => setLugroom(e.target.value)}
                                        placeholder="Amount of luggage room"
                                        className="mobile:w-full mt-4   text-black dark:text-white" />
                                <p className="text-black dark:text-white font-RobotoRegular text-xs mt-2">Enter the amount of luggage that can fit in the trunk.</p>
                                </div>
                                </div>

                                <h1 className="text-black dark:text-white text-xl mt-10 font-RobotoSemiBold">Legal Information</h1>
                                <h1 className="text-black dark:text-white text-md mt- mb-2 font-RobotoRegular">Federal and state law requires vehicle information to be securely stored on any digitalized ridesharing platform.</h1>

                                <div className="flex flex-row w-full space-x-4 items-center">
                                <Input 
                                        type="text"
                                        label="License Plate"
                                        value={licensePlate}
                                        onChange={(e) => setLicensePlate(e.target.value)}
                                        placeholder="Enter license plate"
                                        className="mobile:w-full mt-4   text-black dark:text-white" />

                                <Input 
                                        type="text"
                                        label="State"
                                        value={licenseState}
                                        onChange={(e) => setLicenseState(e.target.value)}
                                        placeholder="Enter license state"
                                        className="mobile:w-full mt-4   text-black dark:text-white" />
                                </div>
                            </div>
                        )
                    }

                    {
                        currentPage === 2 && (
                            <div className="flex flex-row mt-4 items-center space-x-4 ml-auto mt-">
                                <Button
                                    onClick={() => setCurrentPage(1)}
                                    className="bg-neutral-200 hover:bg-neutral-300 text-black dark:text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 p-4 rounded-full">
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => setCurrentPage(3)}
                                    className="bg-green-600 hover:bg-green-500 text-white dark:bg-gator-translucent p-4 rounded-full">
                                    Next
                                </Button>
                            </div>
                        )
                    }

                    {
                        currentPage === 3 && (
                            <div className="flex flex-col w-full h-full">
                                <h1 className="text-black dark:text-white text-xl font-RobotoSemiBold">Agreement</h1>
                                <p className="text-black dark:text-white text-sm font-RobotoRegular">By submitting this application, I certify that all information provided is accurate and truthful to the best of my knowledge. I understand that applying to become a driver does not guarantee acceptance, and my eligibility will be reviewed based on the platform’s requirements. I agree to abide by all local, state, and federal laws while using this ridesharing platform and acknowledge that any false information or violation of terms may result in the rejection or termination of my application. Additionally, I consent to background and vehicle checks as part of the approval process.</p>
                            </div>
                        )
                    }

                    {
                        currentPage === 3 && (
                            <div className="flex flex-row mt-4 items-center space-x-4 ml-auto mt-">
                                <Button
                                    onClick={() => setCurrentPage(2)}
                                    className="bg-neutral-200 hover:bg-neutral-300 text-black dark:text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 p-4 rounded-full">
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => {
                                        // Submit application
                                        fetch(fetchBase + "/v1/driver/apply", {
                                            method: 'POST', credentials: 'include',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
                                              'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username')
                                            },
                                            body: JSON.stringify({
                                                first_name: firstName,
                                                last_name: lastName,
                                                email: email,
                                                phone: phone,
                                                dob: dob.toString(),
                                                address: address,
                                                address_line_2: addressLine2,
                                                city: city,
                                                state: state,
                                                zip: zip,
                                                make: make,
                                                model: model,
                                                year: year,
                                                color: color,
                                                license_plate: licensePlate,
                                                license_state: licenseState,
                                                seats: parseInt(seats),
                                                lugroom: parseInt(lugroom)
                                            })
                                        }).then(res => res.json()).then(data => {
                                            if(data.success) {
                                                // Refresh page
                                                window.location.href ="/driver-application?uuid=" + data.application_uuid;
                                            } else {
                                                alert(data.error);
                                            }
                                        }).catch(err => {
                                            console.error(err);
                                            alert(err);
                                        })
                                    }}
                                    className="bg-green-600 hover:bg-green-500 text-white dark:bg-gator-translucent p-4 rounded-full">
                                    Finish
                                </Button>
                            </div>
                        )
                    }
                </div>
                <div className="flex w-full lg:w-1/2 h-full items-center justify-center">
                    <img src={social} className="h-96 w-96" />
                </div>
            </div>
        </div>
    )
}

export default DriverApply