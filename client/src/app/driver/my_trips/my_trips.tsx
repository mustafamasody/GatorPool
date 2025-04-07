import React, { useEffect, useState } from 'react'
import { AccountData } from '../../view_controller';
import { TripEntity } from '../../../common/types/trip_entity';
import fetchBase from '../../../common/fetchBase';
import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';

interface MyTripsProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const MyTrips: React.FC<MyTripsProps> = ({ accountData, setAccountData }) => {

    const [trips, setTrips] = useState<TripEntity[]>([]);

    const navigate = useNavigate();

    const fetchTrips = async () => {
        fetch(`${fetchBase}/v1/driver/trips`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
            }
        }).then(res => res.json()).then(data => {
            if(data.success) {
                setTrips(data.trips);
            } else {
                console.error(data.error);
            }
        }).catch(err => {
            console.error(err);
        })
    }

    useEffect(() => {
        fetchTrips();
    }, []);

    return (
        <div className="flex flex-col space-y- bg-white dark:bg-[#0c0c0c] h-screen">
            <p className="text-xl font-RobotoBold p-8  text-left mr-auto mb-4 text-black dark:text-white">My Trips</p>

            <div className="flex overflow-x-auto max-w-screen">
            <table className="w-full">
                <thead>
                    <tr>
                        <th className="text-left px-6 py-4 text-black dark:text-white">To</th>
                        <th className="text-left px-6 py-4 text-black dark:text-white">Status</th>
                        <th className="text-left px-6 py-4 text-black dark:text-white">Fare</th>
                        <th className="text-left px-6 py-4 text-black dark:text-white">When</th>
                        <th className="text-left px-6 py-4 text-black dark:text-white">Riders</th>
                        <th className="text-left px-6 py-4 text-black dark:text-white">Trip Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {trips.map((trip) => (
                        <tr onClick={() => {
                            navigate(`/drivertrip/${trip.trip_uuid}`);
                        }} className="hover:cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-900" key={trip.trip_uuid}>
                            <td className="text-left text-black dark:text-white px-6 py-4">{trip.waypoints.find((waypoint) => waypoint.type === "destination")?.geo_text}</td>
                            <td className="text-left text-black dark:text-white px-6 py-4">{trip.status}</td>
                            <td className="text-left text-black dark:text-white px-6 py-4">{trip.fare?.aggregated}</td>
                            <td className="text-left text-black dark:text-white px-6 py-4">{new Date(trip.datetime).toLocaleString()}</td>
                            <td className="text-left text-black dark:text-white px-6 py-4">{trip.riders?.length || 0}</td>
                            <td className="text-left text-black dark:text-white px-6 py-4">
                                <Button
                                color="primary"
                                onPress={() => {
                                    navigate(`/drivertrip/${trip.trip_uuid}`);
                                }}>
                                    View Trip
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
    )
}

export default MyTrips