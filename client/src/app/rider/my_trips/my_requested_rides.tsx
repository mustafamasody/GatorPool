import React, { useState, useEffect } from 'react'
import fetchBase from '../../../common/fetchBase'
import { AccountData } from '../../view_controller'
import { TripEntity } from '../../../common/types/trip_entity'
import { Button, CircularProgress } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

const MyRequestedRides = () => {
    const [trips, setTrips] = useState<TripEntity[]>(null);
    const [currentSessionsPage, setCurrentSessionsPage] = useState<number>(1);
    const [totalSessionsPages, setTotalSessionsPages] = useState<number>(1);

    const navigate = useNavigate();

    const [userUUID, setUserUUID] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${fetchBase}/v1/rider/trips?page=${currentSessionsPage}&flow_type=requested`, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
            }
        }).then(res => res.json()).then(data => {
            setTimeout(() => {
                setTrips(data.trips);
                setTotalSessionsPages(data.totalPages);
                setUserUUID(data.userUUID);
            }, 100);
        })
    }, [currentSessionsPage])

    if(trips === null) {
        return (
                <div className="flex flex-col w-full h-[calc(100vh-14rem)]  items-center justify-center">
                    <CircularProgress
                        size="lg"
                        color="primary"
                    />
                </div>
        )
    }
     else if(trips.length === 0) {
        return (
            <div className="flex flex-col space-y- bg-white dark:bg-[#0c0c0c] h-full">
                <div className="flex flex-col w-full h-full items-center justify-center">
                    <h1 className="text-4xl font-RobotoBold text-black dark:text-white">No trips found.</h1>
                    <h1 className="text-lg font-RobotoBold text-black dark:text-white">Check out what's available.</h1>
                    <Button
                    color="primary"
                    className="mt-4"
                    onPress={() => {
                        navigate('/find-ride');
                    }}>
                        Find Rides
                    </Button>
                </div>
            </div>
        )
    } else {
        return (
    
                <div className="flex flex-col w-full h-full ">
                <div className="flex overflow-x-auto max-w-screen">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="text-left px-6 py-4 text-black dark:text-white">To</th>
                                <th className="text-left px-6 py-4 text-black dark:text-white">Status</th>
                                <th className="text-left px-6 py-4 text-black dark:text-white">Accepted</th>
                                <th className="text-left px-6 py-4 text-black dark:text-white">When</th>
                                <th className="text-left px-6 py-4 text-black dark:text-white">Trip Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trips.map((trip) => (
                                <tr onClick={() => {
                                    navigate(`/ridertrip/requested/${trip.trip_uuid}`);
                                }} className="hover:cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-900" key={trip.trip_uuid}>
                                    <td className="text-left text-black dark:text-white px-6 py-4">{trip.waypoints.find((waypoint) => waypoint.type === "destination")?.geo_text}</td>
                                    <td className="text-left text-black dark:text-white px-6 py-4">{trip.status}</td>
                                    <td className="text-left text-black dark:text-white px-6 py-4">{trip.riders.find((rider) => rider.user_uuid === userUUID)?.accepted ? "Yes" : "No"}</td>
                                    <td className="text-left text-black dark:text-white px-6 py-4">{new Date(trip.datetime).toLocaleString()}</td>
                                    <td className="text-left text-black dark:text-white px-6 py-4">
                                        <Button
                                        color="primary"
                                        onPress={() => {
                                            navigate(`/ridertrip/requested/${trip.trip_uuid}`);
                                        }}>
                                            View Trip
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>

                    <div className="flex flex-col w-full">
                        <div className="flex flex-row items-center justify-center">
                            <button className="text-black dark:text-white bg-slate-100 hover:bg-slate-200 rounded-full p-2 dark:bg-neutral-900 dark:hover:bg-neutral-800" onClick={() => {
                                if(currentSessionsPage > 1) {
                                    setCurrentSessionsPage(currentSessionsPage - 1);
                                }
                            }}>
                                <ChevronLeftIcon className="text-black dark:text-white" />
                            </button>
                            <h1 className="text-black dark:text-white mx-4 font-RobotoMedium text-lg">
                                {currentSessionsPage} / {totalSessionsPages}
                            </h1>
                            <button className="text-black dark:text-white bg-slate-100 hover:bg-slate-200 rounded-full p-2 dark:bg-neutral-900 dark:hover:bg-neutral-800" onClick={() => {
                                if(currentSessionsPage < totalSessionsPages) {
                                    setCurrentSessionsPage(currentSessionsPage + 1);
                                }
                            }}>
                                <ChevronRightIcon className="text-black dark:text-white" />
                            </button>
                        </div>
                    </div>
                </div>
        )
    }
}

export default MyRequestedRides;