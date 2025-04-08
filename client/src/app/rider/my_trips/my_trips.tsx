import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import fetchBase from '../../../common/fetchBase'
import { AccountData } from '../../view_controller'
import { TripEntity } from '../../../common/types/trip_entity'
import { Button, CircularProgress } from '@heroui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import MyCreatedRides from './my_created_rides';

interface MyTripsProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const initialTabs = [
    { id: 0, title: "My Requested Rides", show: true },
    { id: 1, title: "My Created Rides", show: true },
];

const MyTripsRider = ({ accountData, setAccountData }: MyTripsProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');

    const [currentType, setCurrentType] = useState<string>("my_created_rides");
    const [activeTab1, setActiveTab1] = useState(0);
    const [tabStyle1, setTabStyle1] = useState({});
    const tabRef1 = useRef<HTMLDivElement>(null);
    const [tabs, setTabs] = useState(initialTabs);

    // Handle initial tab state from URL
    useEffect(() => {
        if (!tabParam) {
            // If no tab parameter, set default and update URL
            navigate(`${location.pathname}?tab=created`, { replace: true });
            setActiveTab1(0);
        } else {
            // Set active tab based on URL parameter
            setActiveTab1(tabParam === 'created' ? 0 : 1);
        }
    }, [tabParam, location.pathname, navigate]);

    useLayoutEffect(() => {
        if (!tabRef1.current) return;
        const activeTabElement = tabRef1.current.querySelector(`#tab-${activeTab1}`);
        if (activeTabElement) {
            const newTabStyle = {
                left: activeTabElement.getBoundingClientRect().left - tabRef1.current.getBoundingClientRect().left,
                width: activeTabElement.getBoundingClientRect().width
            };
            setTabStyle1(newTabStyle);
        }
    }, [activeTab1, tabs]);

    const handleTabClick1 = (tabId: number) => {
        setActiveTab1(tabId);
        // Update URL with new tab state
        const newTab = tabId === 0 ? 'created' : 'requested';
        navigate(`${location.pathname}?tab=${newTab}`);
    };

    return (
        <div className="flex flex-col space-y-4 bg-white p-8 dark:bg-[#0c0c0c] h-screen">
            <h1 className="text-3xl font-RobotoBold text-black dark:text-white">
                My Trips
            </h1>

            <h1 className="text-sm lg:text-lg w-full lg:w-1/2 mt-2 font-RobotoMedium text-gray-800 dark:text-gray-300">
                Trips that you went on, going on, or requested.
            </h1>

            <div className="relative w-full" ref={tabRef1}>
                <div className="flex justify-start w-full mx-auto mobile:overflow-auto">
                    {tabs.map((tab) => (
                        tab.show && (
                            <div
                                key={tab.id}
                                id={`tab-${tab.id}`}
                                className={`cursor-pointer rounded-md py-2 px-4 text-black dark:text-white ${
                                    activeTab1 === tab.id ? "font-bold" : ""
                                }`}
                                onClick={() => handleTabClick1(tab.id)}
                            >
                                {tab.title}
                            </div>
                        )
                    ))}
                </div>
                <div
                    className="absolute bottom-0 h-1 bg-emerald-500 transition-all duration-300"
                    style={tabStyle1}
                />
            </div>

            <div className="flex-1 h-full min-w-full max-h-[calc(100vh-14rem)] overflow-y-auto">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`h-full w-full ${activeTab1 === tab.id ? "block" : "hidden"}`}
                    >
                        <div className="">
                            {/* Add your tab content here */}
                            {
                                tab.id === 1 ? (
                                    <MyCreatedRides />
                                ) : (
                                    <></>
                                )
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MyTripsRider