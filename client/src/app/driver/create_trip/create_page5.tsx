import React, { useState, useEffect, useRef } from 'react';
import { AccountData } from '../../view_controller';
import { Button, Input } from '@heroui/react';
import {DatePicker} from "@heroui/react";
import {parseDate, getLocalTimeZone} from "@internationalized/date";
import fetchBase from '../../../common/fetchBase';
import {now, parseAbsoluteToLocal, today} from "@internationalized/date";
import mapboxgl from 'mapbox-gl';
import { Feature, Polygon } from "geojson";
import { CreateTripDriverFlowOptionsEntity } from '../types';
import {Checkbox} from "@heroui/react";
import { REQUEST_HEADERS } from '../../utils/headers';
import { useNavigate } from 'react-router-dom';
interface CreatePage5Props {
    tripOptions?: CreateTripDriverFlowOptionsEntity;
    setTripOptions: React.Dispatch<React.SetStateAction<CreateTripDriverFlowOptionsEntity>>;
    accountData: AccountData;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

const CreatePage5: React.FC<CreatePage5Props> = ({ tripOptions, setTripOptions, accountData, setCurrentPage }) => {
    
    const [loadingCreateTrip, setLoadingCreateTrip] = useState(false);

    const [error, setError] = useState<string>(null);

    const navigate = useNavigate();

    const createTrip = async () => {
        setLoadingCreateTrip(true);

        fetch(fetchBase + "/v1/trip", {
            method: "POST",
            headers: REQUEST_HEADERS,
            credentials: 'include',
            body: JSON.stringify({
                tripOptions
            })
        }).then(res => res.json()).then(data => {
            if(data.success) {
                setLoadingCreateTrip(false);
                navigate('/my-trips');
            } else {
                setError(data.error);
            }
        }).catch(err => {
            setError("An error occurred while creating the trip. Please try again later.");
        })
    };

    return (
            <div className="flex flex-col w-full gap-4 h-full">
                <div className="flex flex-col w-full max-h-[calc(100vh-8rem)] overflow-y-auto">
                <h1 className="font-RobotoBold text-3xl text-black dark:text-white">
                    Let's get you on the road
                </h1>
                <p className="font-RobotoRegular mt-1 text-sm max-w-md text-black dark:text-white">
                    View a summary of your trip before you post it. Make sure all the information is correct before proceeding.
                </p>

                <h1 className="font-RobotoSemiBold text-2xl text-black dark:text-white mt-4">
                    General Information
                </h1>
                <div className="flex flex-row items-center mt-2">
                    <div className="flex flex-col">
                        <div className="flex flex-col">
                            <p className="font-RobotoSemiBold text-lg text-black dark:text-white">
                                From
                            </p>
                            <p className="font-RobotoRegular text-sm text-black dark:text-white">
                                {tripOptions?.from?.text}
                            </p>
                        </div>
                        <div className="flex flex-col mt-4">
                            <p className="font-RobotoSemiBold text-lg text-black dark:text-white">
                                To
                            </p>
                            <p className="font-RobotoRegular text-sm text-black dark:text-white">
                                {tripOptions?.to?.text}
                            </p>
                        </div>
                    </div>
                    <div className="h-full w-[0.3rem] mx-4 rounded-t-lg rounded-b-lg bg-neutral-400 dark:bg-neutral-700"></div>
                    <div className="flex flex-col">
                        <div className="flex flex-col ">
                            <p className="font-RobotoSemiBold text-lg text-black dark:text-white">
                                When
                            </p>
                            <p className="font-RobotoRegular text-sm text-black dark:text-white">
                                {new Date(tripOptions?.datetime).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex flex-col mt-4">
                            <p className="font-RobotoSemiBold text-lg text-black dark:text-white">
                                Dropoff Radius
                            </p>
                            <p className="font-RobotoRegular text-sm text-black dark:text-white">
                                {tripOptions?.radius} miles
                            </p>
                        </div>
                    </div>
                    </div>

                    <h1 className="font-RobotoSemiBold text-2xl text-black dark:text-white mt-6">
                        Fare Details
                    </h1>

                    <div className="flex flex-col mt-2">
                        <div className="flex flex-col ">
                            <p className="font-RobotoSemiBold text-lg text-black dark:text-white">
                                Trip Price
                            </p>
                            <p className="font-RobotoRegular text-sm text-black dark:text-white">
                                {tripOptions?.fare?.trip || "N/A"}
                            </p>
                        </div>
                        <div className="flex flex-col mt-4">
                            <p className="font-RobotoSemiBold text-lg text-black dark:text-white">
                                Gas Price
                            </p>
                            <p className="font-RobotoRegular text-sm text-black dark:text-white">
                                {tripOptions?.fare?.gas || "N/A"}
                            </p>
                        </div>
                        <div className="flex flex-col mt-4">
                            <p className="font-RobotoSemiBold text-lg text-black dark:text-white">
                                Food Price
                            </p>
                            <p className="font-RobotoRegular text-sm text-black dark:text-white">
                                {tripOptions?.fare?.food || "N/A"}
                            </p>
                        </div>
                    </div>

                    <h1 className="font-RobotoSemiBold text-2xl text-black dark:text-white mt-6">
                        Preferences
                    </h1>

                    <div className="flex flex-col mt-2">
                        <div className="flex flex-row items-center space-x-2 ">
                            <p className="font-RobotoRegular text-lg text-black dark:text-white">
                                Rider can change or request music?
                            </p>
                            <p className={`font-RobotoRegular text-lg 
                                ${tripOptions?.music_preferences?.can_be_controlled ? "text-green-500" : "text-red-500"}`}>
                                {tripOptions?.music_preferences?.can_be_controlled ? "Yes" : "No"}
                            </p>
                        </div>
                        <div className="flex flex-row items-center space-x-2 mt-2">
                            <p className="font-RobotoRegular text-lg text-black dark:text-white">
                                Rider can change or request to change the AC?
                            </p>
                            <p className={`font-RobotoRegular text-lg 
                                ${tripOptions?.ac_preferences?.can_be_controlled ? "text-green-500" : "text-red-500"}`}>
                                {tripOptions?.ac_preferences?.can_be_controlled ? "Yes" : "No"}
                            </p>
                        </div>
                        <div className="flex flex-row items-center space-x-2 mt-2">
                            <p className="font-RobotoRegular text-lg text-black dark:text-white">
                                Conversating:
                            </p>
                            <p className={`font-RobotoRegular text-lg 
                                ${tripOptions?.talking_preferences?.minimal ? "text-green-500" : tripOptions?.talking_preferences?.silent ? "text-blue-500" : "text-red-500"}`}>
                                {tripOptions?.talking_preferences?.minimal ? "Minimal" : tripOptions?.talking_preferences?.silent ? "Silent" : "Open"}
                            </p>
                        </div>
                    </div>

                    <h1 className="font-RobotoSemiBold text-2xl text-black dark:text-white mt-6">
                        Carpooling
                    </h1>

                    <div className="flex flex-col mt-0">
                        <div className="flex flex-col ">
                            <p className={`font-RobotoSemiBold text-lg 
                                ${tripOptions?.carpool ? "text-green-500" : "text-red-500"}`}>
                                {
                                    tripOptions?.carpool ? "Carpooling is enabled for this trip" : "Carpooling is disabled for this trip"
                                }
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row w-full mt-auto ml-auto space-x-4">
                    <Button
                        className="ml-auto "
                        color="default"
                        onClick={() => {
                            setCurrentPage(4);
                        }}
                    >
                        Previous
                    </Button>
                    <Button
                        isLoading={loadingCreateTrip}
                        className="text-white"
                        color="primary"
                        onClick={() => {
                            createTrip();
                        }}
                    >
                        Create Trip
                    </Button>
                </div>

                {error && (
                    <h1 className="text-red-500">{error}</h1>
                )}
            </div>
    );
};

export default CreatePage5;









// fdsafdsfdsf