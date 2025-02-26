import React, { useState, useEffect } from 'react';
import { AccountData } from '../../view_controller';
import { Button, Input } from '@heroui/react';
import {DatePicker} from "@heroui/react";
import {parseDate, getLocalTimeZone} from "@internationalized/date";
import fetchBase from '../../../common/fetchBase';
import { useLocation } from 'react-router-dom';
import { DriverApplicationEntity } from '../types';

const ApplicationView = () => {

    const [uuid, setUuid] = useState<string | null>(null);
    const location = useLocation(); // React Router's location hook

    const [driverApplication, setDriverApplication] = useState<DriverApplicationEntity>(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const uuidParam = params.get("uuid");
        setUuid(uuidParam);

        fetch(fetchBase + "/v1/driver/application/" + uuidParam, {
            method: 'GET', credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
              'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username')
            },
        }).then(res => res.json()).then(data => {
            if(data.success) {
                setDriverApplication(data.driver_application);
            } else {
                alert(data.error);
            }
        }).catch(err => {
            console.error(err);
            alert(err);
        })

    }, [location]);

    return (
        <div className="flex flex-col space-y- bg-white dark:bg-black min-h-screen p-8">
            <h1 className="text-black dark:text-white text-3xl font-RobotoBold">
                Your application is {
                    driverApplication?.closed ? <span className="text-red-500">closed</span> : <span className="text-green-500">open</span>
                }
            </h1>
            
            <div className="flex flex-col max-w-[28rem]">
                <h1 className="text-black dark:text-white text-lg mt-8 font-RobotoSemiBold">Status</h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Status: <span className="font-RobotoSemiBold">{driverApplication?.accepted ? "Accepted" : driverApplication?.closed ? "Rejected" : "Pending"}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Created At: <span className="font-RobotoSemiBold">{new Date(driverApplication?.created_at).toLocaleString()}</span>
                </h1>

                <h1 className="text-black dark:text-white text-lg mt-8 font-RobotoSemiBold">Application Details</h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Full Name: <span className="font-RobotoSemiBold">{driverApplication?.full_name}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Email: <span className="font-RobotoSemiBold">{driverApplication?.email}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Phone Number: <span className="font-RobotoSemiBold">{driverApplication?.phone_number}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Date of Birth: <span className="font-RobotoSemiBold">{driverApplication?.date_of_birth}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Address: <span className="font-RobotoSemiBold">{driverApplication?.address}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Address Line 2: <span className="font-RobotoSemiBold">{driverApplication?.address_line_2}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    City: <span className="font-RobotoSemiBold">{driverApplication?.city}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    State: <span className="font-RobotoSemiBold">{driverApplication?.state}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Zip Code: <span className="font-RobotoSemiBold">{driverApplication?.zip_code}</span>
                </h1>

                <h1 className="text-black dark:text-white text-lg mt-8 font-RobotoSemiBold">Vehicle Details</h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Make: <span className="font-RobotoSemiBold">{driverApplication?.vehicle?.make}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Model: <span className="font-RobotoSemiBold">{driverApplication?.vehicle?.model}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Year: <span className="font-RobotoSemiBold">{driverApplication?.vehicle?.year}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Color: <span className="font-RobotoSemiBold">{driverApplication?.vehicle?.color}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    License Plate: <span className="font-RobotoSemiBold">{driverApplication?.vehicle?.license_plate}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    State: <span className="font-RobotoSemiBold">{driverApplication?.vehicle?.state}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Seats: <span className="font-RobotoSemiBold">{driverApplication?.vehicle?.seats}</span>
                </h1>
                <h1 className="text-black dark:text-white text-lg mt-1 font-RobotoRegular border-b-1 border-neutral-500">
                    Lugroom: <span className="font-RobotoSemiBold">{driverApplication?.vehicle?.lugroom}</span>
                </h1>
            </div>

        </div>
    );
}

export default ApplicationView;