import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Input, Checkbox, Tooltip } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { RiderQueryEntity } from '../../../common/types/rider_query';
import { REQUEST_HEADERS } from '../../utils/headers';
import { AccountData } from '../../view_controller';
import fetchBase from '../../../common/fetchBase';
import {now, parseAbsoluteToLocal, today} from "@internationalized/date";
import {DatePicker} from "@heroui/react";
import {parseDate, getLocalTimeZone} from "@internationalized/date";
import mapboxgl from 'mapbox-gl';
import { WaypointEntity } from '../../../common/types/waypoint';
import { ChevronDownIcon, ChevronUpIcon, X } from 'lucide-react';
import { debounce } from '../../utils/debounce';
import { TripEntity } from '../../../common/types/trip_entity';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import HailIcon from '@mui/icons-material/Hail';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { DriverProfile } from '../../../common/types/driver_info';
import { addToast } from '@heroui/react';

interface FeedDisplayProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
    tripsResult: TripEntity[];
    driverProfiles: DriverProfile[];
}

const FeedDisplay = ({ accountData, setAccountData, tripsResult, driverProfiles }: FeedDisplayProps) => {

    const navigate = useNavigate();

    const [isFemale, setIsFemale] = useState<boolean>(false);

    const [requestedTrip, setRequestedTrip] = useState<TripEntity>(null);
    const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

    useEffect(() => {
        fetch(`${fetchBase}/v1/rider/gender`, {
            method: 'GET',
            credentials: 'include',
            headers: REQUEST_HEADERS
        }).then(res => res.json()).then(data => {
            setIsFemale(data.gender === "female");
        })
    }, []);

    return (
        <div>
            <div className="flex flex-col h-screen p-8 w-full bg-white dark:bg-[#0c0c0c]">
                <h1 className="text-3xl font-RobotoBold text-black dark:text-white">
                    We found {tripsResult.length} trip{tripsResult.length === 1 ? "" : "s"} for you
                </h1>

                <div className="flex flex-col gap-4 mt-6">
                    {tripsResult.map((trip) => (
                        <div key={trip.trip_uuid} className="flex flex-col w-full border border-2 border-green-600 rounded-2xl">
                            <div className="flex flex-col p-4">
                                <p className="text-xs w-auto font-RobotoMedium text-gray-700 dark:text-gray-300">
                                    PICKUP
                                </p>
                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    Location: <span className="font-RobotoBold">{trip.waypoints.find((waypoint) => waypoint.type === "pickup")?.geo_text}</span> 
                                </h2>
                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    Date: <span className="font-RobotoBold">{new Date(trip.datetime).toLocaleString()}</span>
                                </h2>
                            </div>

                            <div className="w-full bg-green-600 h-[2px] rounded-full" />

                            <div className="flex flex-col p-4">
                                <p className="text-xs w-auto font-RobotoMedium text-gray-700 dark:text-gray-300">
                                    DROPOFF
                                </p>
                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    Destination: <span className="font-RobotoBold">{trip.waypoints.find((waypoint) => waypoint.type === "destination")?.geo_text}</span>
                                </h2>
                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    Expected Dropoff: <span className="font-RobotoBold">{new Date(trip.waypoints.find((waypoint) => waypoint.type === "destination")?.expected).toLocaleString()}</span>
                                </h2>
                            </div>

                            <div className="w-full bg-green-600 h-[2px] rounded-full" />

                            <div className="flex flex-col p-4">
                                <p className="text-xs w-auto font-RobotoMedium  text-gray-700 dark:text-gray-300">
                                    DRIVER INFORMATION
                                </p>
                                <div className="flex flex-row items-center gap-2 mt-2">
                                    <img src={driverProfiles.find((driver) => driver.trip_uuid === trip.trip_uuid)?.profile_picture} alt="Profile Picture" className="w-10 h-10 rounded-full" />
                                    <div className="flex flex-col text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                        <span className="text-md font-RobotoRegular text-black dark:text-white">
                                            {driverProfiles.find((driver) => driver.trip_uuid === trip.trip_uuid)?.first_name} {" "}
                                            {driverProfiles.find((driver) => driver.trip_uuid === trip.trip_uuid)?.last_name}
                                        </span>
                                        <span className="text-xs font-RobotoRegular text-gray-700 dark:text-gray-300">
                                            {driverProfiles.find((driver) => driver.trip_uuid === trip.trip_uuid)?.rating || "No rating yet"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full bg-green-600 h-[2px] rounded-full" />

                            <div className="flex flex-col p-4">
                                <p className="text-xs w-auto font-RobotoMedium  text-gray-700 dark:text-gray-300">
                                    TRIP DETAILS
                                </p>

                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    Fare: $<span className="font-RobotoBold">{trip?.fare?.aggregated}</span>{" "}
                                    <Tooltip content={`Trip: $${trip?.fare?.trip} | Food: $${trip?.fare?.food} | Gas: $${trip?.fare?.gas}`} className="text-white dark">
                                        <span className="underline font-RobotoBold hover:cursor-pointer">View Fare Breakdown</span>
                                    </Tooltip>
                                </h2>

                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    {
                                        (trip?.rider_requirements?.pay_food ||
                                        trip?.rider_requirements?.pay_gas ) && (
                                            <span>You are required to: {
                                                trip?.rider_requirements?.pay_food && "pay for food"
                                            } {
                                                trip?.rider_requirements?.pay_gas && "pay for gas"
                                            }</span>
                                        )
                                    }
                                </h2>

                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    {
                                        trip?.miscellaneous?.ac.can_be_controlled ? "AC can be controlled" : "AC cannot be controlled"
                                    }
                                </h2>

                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    {
                                        trip?.miscellaneous?.music.can_be_controlled ? "Music can be controlled" : "Music cannot be controlled"
                                    }
                                </h2>
                            </div>

                            <div className="w-full bg-green-600 h-[2px] rounded-full" />

                            <div className="flex flex-col p-4">
                                <p className="text-xs w-auto font-RobotoMedium  text-gray-700 dark:text-gray-300">
                                    ACTIONS
                                </p>

                                <Button
                                    className="mt-auto w-fit mt-2"
                                    variant="solid"
                                    color="primary"
                                    onPress={() => {
                                        setRequestedTrip(trip);
                                        // navigate(`/rider/trip/${trip.trip_uuid}`);
                                    }}
                                >
                                    Request Trip
                                </Button>
                            </div>
                        </div>
                    ))} 
                </div>
            </div>

            {
                requestedTrip && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white dark:bg-[#0c0c0c] w-full md:w-[30rem] p-8 h-auto rounded-xl">
                            <div className="flex flex-row items-center justify-between">
                                <h2 className="text-xl font-RobotoBold text-black dark:text-white">
                                    Request Trip
                                </h2>
                                <button onClick={() => setRequestedTrip(null)} className="hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full p-2">
                                    <X size={24} className="text-gray-700 dark:text-gray-300" />
                                </button>
                            </div>

                            <div className="flex flex-row items-center gap-2 mt-4">
                                    <img src={driverProfiles.find((driver) => driver.trip_uuid === requestedTrip.trip_uuid)?.profile_picture} alt="Profile Picture" className="w-10 h-10 rounded-full" />
                                    <div className="flex flex-col text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                        <span className="text-md font-RobotoRegular text-black dark:text-white">
                                            {driverProfiles.find((driver) => driver.trip_uuid === requestedTrip.trip_uuid)?.first_name} {" "}
                                            {driverProfiles.find((driver) => driver.trip_uuid === requestedTrip.trip_uuid)?.last_name}
                                        </span>
                                        <span className="text-xs font-RobotoRegular text-gray-700 dark:text-gray-300">
                                            {driverProfiles.find((driver) => driver.trip_uuid === requestedTrip.trip_uuid)?.rating || "No rating yet"}
                                        </span>
                                    </div>
                            </div>

                            <div className="flex flex-col mt-4">
                                <p className="text-xs w-auto font-RobotoMedium text-gray-700 dark:text-gray-300">
                                    PICKUP
                                </p>
                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    Location: <span className="font-RobotoBold">{requestedTrip.waypoints.find((waypoint) => waypoint.type === "pickup")?.geo_text}</span> 
                                </h2>
                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    Date: <span className="font-RobotoBold">{new Date(requestedTrip.datetime).toLocaleString()}</span>
                                </h2>
                            </div>

                            <div className="flex flex-col mt-4">
                                <p className="text-xs w-auto font-RobotoMedium text-gray-700 dark:text-gray-300">
                                    DROPOFF
                                </p>
                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    Destination: <span className="font-RobotoBold">{requestedTrip.waypoints.find((waypoint) => waypoint.type === "destination")?.geo_text}</span>
                                </h2>
                                <h2 className="text-md font-RobotoRegular text-gray-700 dark:text-gray-300">
                                    Expected Dropoff: <span className="font-RobotoBold">{new Date(requestedTrip.waypoints.find((waypoint) => waypoint.type === "destination")?.expected).toLocaleString()}</span>
                                </h2>
                            </div>

                            <div className="flex flex-col mt-4">
                                <Checkbox
                                    className="text-black dark:text-white"
                                    checked={acceptedTerms}
                                    onChange={() => setAcceptedTerms(!acceptedTerms)}
                                >
                                    I agree that payment will be handled solely between the driver and I. I accept that GatorPool is not liable for any issues that may arise, but
                                    offers safety features to ensure the trip is safe. I accept that my ride request may be denied by the driver.
                                </Checkbox>
                            </div>

                            <div className="flex flex-col mt-4">
                                <Button
                                    className="mt-auto ml-auto w-fit mt-2"
                                    variant="solid"
                                    color="primary"
                                    onPress={() => {
                                        if(!acceptedTerms) {
                                            addToast({
                                                title: "Terms and conditions not accepted",
                                                description: "You must accept the terms and conditions to request a ride.",
                                                color: "danger"
                                            });
                                            return;
                                        }

                                        fetch(`${fetchBase}/v1/trip/request/${requestedTrip.trip_uuid}`, {
                                            method: "POST",
                                            credentials: "include",
                                            headers: REQUEST_HEADERS,
                                            body: JSON.stringify({
                                                trip_uuid: requestedTrip.trip_uuid
                                            })
                                        }).then(res => res.json()).then(data => {
                                            if(data.success) {
                                                navigate('/rider-flow/trips?tab=created');
                                            } else {
                                                addToast({
                                                    title: "Error requesting trip",
                                                    description: data.error,
                                                    color: "danger"
                                                });
                                            }
                                            // console.log(data);
                                        }).catch(err => {
                                            addToast({
                                                title: "Error requesting trip",
                                                description: "There was an error requesting the trip. Please try again later.",
                                                color: "danger"
                                            });
                                            console.log(err);
                                        })
                                    }}
                                >
                                    Request Trip
                                </Button>
                            </div>
                        
                        </div>
                    </div>
                )
            }
        </div>
    )
}

export default FeedDisplay