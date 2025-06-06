import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { AccountData } from '../../view_controller';
import { TripDriverRequestEntity, TripEntity } from '../../../common/types/trip_entity';
import fetchBase from '../../../common/fetchBase';
import { addToast, Button, Checkbox, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, NumberInput } from '@heroui/react';
import { ArrowLeft, Check, Pencil, Save, Trash, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DriverProfile } from '../../../common/types/driver_info';

interface RiderFlowRequestedTripProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const RiderFlowCreatedTrip = ({ accountData, setAccountData }: RiderFlowRequestedTripProps) => {
    const { trip_uuid } = useParams();
    const navigate = useNavigate();

    const [trip, setTrip] = useState<TripEntity | null>(null);
    const [userUUID, setUserUUID] = useState<string | null>(null);

    const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);

    const [driverRequests, setDriverRequests] = useState<TripDriverRequestEntity[] | null>(null);
    const [driverRequestsProfiles, setDriverRequestsProfiles] = useState<DriverProfile[] | null>(null);

    const [confirmRemoveTrip, setConfirmRemoveTrip] = useState<boolean>(false);

    const [selectedDriverRequest, setSelectedDriverRequest] = useState<TripDriverRequestEntity | null>(null);

    useEffect(() => {
        fetch(`${fetchBase}/v1/rider/trips/${trip_uuid}?flow_type=created`, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
            }
        }).then((res) => res.json()).then((data) => {
            if(data.success) {
                setTrip(data.trip);
                setUserUUID(data.userUUID);

                if(data?.trip?.assigned_driver) {
                    fetch(`${fetchBase}/v1/trip/${trip_uuid}/rflow/driver?flow_type=assigned`, {
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                            'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                            'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
                        }
                    }).then((res) => res.json()).then((data) => {
                        if(data.success) {
                            setDriverProfile(data.driver[0]);
                        } else {
                            addToast({
                                title: "Error",
                                description: data.error,
                            })
                        }
                    }).catch((err) => {
                        addToast({
                            title: "Error",
                            description: "An error occurred while fetching the driver profile.",
                        })
                    })
                } else {
                    fetch(`${fetchBase}/v1/trip/${trip_uuid}/rflow/driver?flow_type=requests`, {
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                            'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                            'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
                        }
                    }).then((res) => res.json()).then((data) => {
                        if(data.success) {
                            setDriverRequestsProfiles(data.driverRequestsProfiles);
                        } else {
                            addToast({
                                title: "Error",
                                description: data.error,
                            })
                        }
                    }).catch((err) => {
                        addToast({
                            title: "Error",
                            description: "An error occurred while fetching the driver profile.",
                        })
                    })
                }
            } else {
                addToast({
                    title: "Error",
                    description: data.error,
                })
            }
        }).catch((err) => {
            addToast({
                title: "Error",
                description: "An error occurred while fetching the trip.",
            })
        })
    }, []);

    const [confirmRemoveDriver, setConfirmRemoveDriver] = useState<boolean>(false);

    const removeDriver = () => {
        fetch(`${fetchBase}/v1/trip/${trip_uuid}/rider/driver/remove/${driverProfile?.user_uuid}`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
            }
        }).then((res) => res.json()).then((data) => {
            if(data.success) {
                setTrip(data.trip);
                setDriverProfile(null);
                setConfirmRemoveDriver(false);
            } else {
                addToast({
                    title: "Error",
                    description: data.error,
                })
            }
        }).catch((err) => {
            addToast({
                title: "Error",
                description: "An error occurred while removing the driver.",
            })
        })
    }

    return (
        <div className="flex flex-col bg-white dark:bg-[#0c0c0c] space-y-4 h-screen overflow-y-auto p-8">
            <div className="flex flex-row space-x-4 items-center">
                <button onClick={() => navigate('/rider-flow/trips')} className="flex items-center justify-center bg-gray-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 rounded-full p-2">
                    <ArrowLeft className="w-8 h-8 text-black dark:text-white" />
                </button>
                <h1 className="text-2xl lg:text-3xl font-RobotoBold text-black dark:text-white">
                    Trip to {trip?.waypoints.find(waypoint => waypoint.type === "destination")?.geo_text} on {new Date(trip?.datetime).toLocaleString()}
                </h1>
                <div className="flex flex-row space-x-2 items-center">
                    {
                        trip?.riders.find(rider => rider.user_uuid === userUUID)?.accepted ? (
                            <div className="flex items-center justify-center bg-green-700 text-white rounded-full px-4 py-2">
                                <p className="text-sm font-RobotoBold">Accepted</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center bg-amber-600 text-white rounded-full px-4 py-2">
                                <p className="text-sm font-RobotoBold">Pending Acceptance</p>
                            </div>
                        )
                    }
                </div>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-3  lg:grid-cols-4 xl:grid-cols-5">
                <div className="flex flex-col bg-gray-200 dark:bg-neutral-900 p-4 rounded-xl h-32">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">From</h1>
                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                        {trip?.waypoints.find(waypoint => waypoint.type === "pickup")?.geo_text}
                    </p>
                </div>
                <div className="flex flex-col bg-gray-200 dark:bg-neutral-900 p-4 rounded-xl h-32">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">To</h1>
                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                        {trip?.waypoints.find(waypoint => waypoint.type === "destination")?.geo_text}
                    </p>
                </div>
                <div className="flex flex-col justify-between bg-gray-200 dark:bg-neutral-900 p-4 rounded-xl h-32">
                    <div>
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">When</h1>
                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                        {new Date(trip?.datetime).toLocaleString()}
                    </p>
                    </div>
                </div>
                <div className="flex flex-col bg-gray-200 dark:bg-neutral-900 p-4 rounded-xl h-32">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Expected Arrival</h1>
                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                        {new Date(trip?.waypoints.find(waypoint => waypoint.type === "destination")?.expected).toLocaleString()}
                    </p>
                </div>
                <div className="flex flex-col bg-gray-200 dark:bg-neutral-900 p-4 rounded-xl h-32">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Fare</h1>
                    <p className="text-black dark:text-white font-RobotoBold text-3xl">
                        ${trip?.fare?.aggregated}
                    </p>
                </div>
            </div>


            <div className="flex mobile:flex-col space-y-4 lg:space-y-0 lg:flex-row w-full h-full lg:space-x-4">
                <div className="flex flex-col min-h-[20rem] h-auto overflow-y-auto lg:h-full w-full lg:w-8/12 bg-gray-200 dark:bg-neutral-900 rounded-xl p-6">
                    {
                        trip?.assigned_driver ? (
                            <div className="flex flex-col space-y-">
                                <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Trip Summary</h1>
                                <h1 className="text-black dark:text-white font-RobotoLight text-md">
                                    Congratulations! You've found a driver for this trip! 
                                </h1>
                            </div>
                        ) : (
                            <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Trip Request</h1>
                        )
                    }

                    {
                        driverProfile && (
                            <div className="flex flex-col space-y-2 mt-2">
                                <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg">Driver Details</h1>
                                <div className="flex flex-row items-center justify-between">
                                    <div className="flex flex-row space-x-2 items-center">
                                        <img src={driverProfile?.profile_picture} alt="Driver Profile" className="w-12 h-12 rounded-full" />
                                        <div className="flex flex-col">
                                            <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                                {driverProfile?.first_name} {driverProfile?.last_name}
                                            </p>
                                            <p className="text-black dark:text-white font-RobotoRegular italic text-sm">
                                                {driverProfile?.email}
                                            </p>
                                        </div>
                                    </div>


                                    <Button
                                        isIconOnly
                                        color="danger"
                                        radius="full"
                                        onPress={() => {
                                            setConfirmRemoveDriver(true);
                                        }}
                                    > 
                                        <Trash className="w-6 h-6 text-white" />
                                    </Button>
                                </div>
                            </div>
                        )
                    }

                    {
                        !trip?.assigned_driver && (
                            <div className="flex flex-col space-y-2 mt-2">
                                <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg">No driver assigned. You will see fare details here once you accept a driver.</h1>
                            </div>
                        )
                    }

                    {
                        trip?.assigned_driver && (
                            <>
                            <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Fare Details</h1>
                            <div className="flex flex-col space-y-2">
                                <div className="flex flex-row space-x-2 items-center">
                       <NumberInput
                            value={trip?.fare?.trip}
                            disabled
                            label="Trip Fare"
                            className="w-full"
                        />
                    </div> 

                    <div className="flex flex-row space-x-2 items-center">
                       <NumberInput
                            value={trip?.fare?.food}
                            disabled
                            label="Food Fare"
                            className="w-full"
                        />
                    </div> 

                    <div className="flex flex-row space-x-2 items-center">
                       <NumberInput
                            value={trip?.fare?.gas}
                            disabled
                            label="Gas Fare"
                            className="w-full"
                        />
                        </div>

                                <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Aggregated Fare: ${trip?.fare?.aggregated}</h1>
                            </div>
                        </>
                    )}

                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Preferences</h1>
                    <div className="flex flex-col space-y-2">
                        <div className="flex flex-row space-x-2 items-center">
                            <Checkbox
                                isDisabled
                                isSelected={trip?.miscellaneous?.music.can_be_controlled}
                            />
                            <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                Passengers can control or request music
                            </p>
                        </div>

                        <div className="flex flex-row space-x-2 items-center">
                            <Checkbox
                            isDisabled
                                isSelected={trip?.miscellaneous?.ac.can_be_controlled}
                            />
                            <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                Passengers can control or request AC
                            </p>
                        </div>

                        <div className="flex flex-row space-x-2 items-center">
                        <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                        Talking preference: {trip?.miscellaneous?.talking.type}
                        </p>
                        </div>
                    </div>

                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Carpooling</h1>
                    <div className="flex flex-row space-x-2 items-center">
                        <Checkbox
                        isDisabled
                            isSelected={trip?.carpool}
                        />
                        <p className="text-black dark:text-white font-RobotoRegular text-sm">
                            Carpooling
                        </p>
                    </div>

                    <h1 className="text-red-500 font-RobotoSemiBold text-lg mt-4">
                        Danger Zone
                        <br></br>
                        <span className="text-red-500 font-RobotoRegular text-sm">
                            Actions done here are irreversible and may affect your account.
                        </span>
                    </h1>

                    {
                        confirmRemoveTrip ? (
                            <div className="flex flex-col space-y-2 mt-4">
                                <p className="text-red-500 font-RobotoRegular text-sm">
                                    Are you sure you want to remove this trip request?
                                </p>

                                <Button
                            color="danger"
                            className="w-48"
                            onPress={() => {
                                fetch(`${fetchBase}/v1/trip/${trip_uuid}/rider/request/remove`, {
                                    method: "POST",
                                    credentials: "include",
                                    headers: {
                                        "Content-Type": "application/json",
                                        'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                                        'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
                                    }
                                }).then((res) => res.json()).then((data) => {
                                    if(data.success) {
                                        navigate('/rider-flow/trips');
                                    } else {
                                        addToast({
                                            title: "Error",
                                            description: data.error,
                                        })
                                    }
                                }).catch((err) => {
                                    addToast({
                                        title: "Error",
                                        description: "An error occurred while removing the trip request.",
                                    })
                                })
                            }}
                        >
                            Confirm Removal
                        </Button>
                            </div>
                        ) : (
                            <Button
                            color="danger"
                            className="w-48 mt-4"
                            onPress={() => {
                                setConfirmRemoveTrip(true);
                            }}
                        >
                            Remove from Trip
                        </Button>
                        )
                    }
                </div>
                <div className="flex flex-col min-h-[20rem] lg:h-full w-full lg:w-4/12 bg-gray-200 dark:bg-neutral-900 rounded-xl p-4">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Driver Requests</h1>
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">
                        {
                            trip?.driver_requests?.length || 0
                        } {
                            trip?.driver_requests?.length === 1 ? " request" : " requests"
                        }
                    </h1>
                    <div className="flex flex-col space-y-2 h-full w-full overflow-y-auto ">
                        {
                            trip?.driver_requests?.map((driver) => (
                                <div
                                onClick={() => {
                                    setSelectedDriverRequest(driver);
                                }}
                                className="flex flex-row items-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 hover:cursor-pointer p-4 rounded-xl">
                                <img src={driverRequestsProfiles?.find(profile => profile.user_uuid === driver.user_uuid)?.profile_picture} alt="Driver Profile" className="w-12 h-12 rounded-full" />
                                <div className="flex flex-col">
                                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                        {driverRequestsProfiles?.find(profile => profile.user_uuid === driver.user_uuid)?.first_name} {driverRequestsProfiles?.find(profile => profile.user_uuid === driver.user_uuid)?.last_name}
                                    </p>
                                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                        Requested on {new Date(driver.requested_at).toLocaleString()}
                                    </p>
                                </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        
        {
            selectedDriverRequest && ( 
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="flex flex-col bg-white dark:bg-neutral-900 p-4 rounded-xl">
                        <div className="flex flex-row justify-between">
                            <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">
                                Driver Request
                            </h1>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full" onClick={() => setSelectedDriverRequest(null)}>
                                <X className="w-6 h-6 text-black dark:text-white" />
                            </button>
                        </div>

                        <div
                                className="flex flex-row my-3 items-center space-x-2 bg-gray-100 dark:bg-neutral-800 p-4 rounded-xl">
                                <img src={driverRequestsProfiles?.find(profile => profile.user_uuid === selectedDriverRequest?.user_uuid)?.profile_picture} alt="Driver Profile" className="w-12 h-12 rounded-full" />
                                <div className="flex flex-col">
                                <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                    {driverRequestsProfiles?.find(profile => profile.user_uuid === selectedDriverRequest?.user_uuid)?.first_name} {driverRequestsProfiles?.find(profile => profile.user_uuid === selectedDriverRequest?.user_uuid)?.last_name}
                                </p>
                                <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                    Requested on {new Date(selectedDriverRequest?.requested_at).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Fare Details</h1>
                        <div className="flex flex-col space-y-2">
                            <div className="flex flex-row space-x-2 items-center">
                                <NumberInput
                                    value={selectedDriverRequest?.fare?.trip}
                                    disabled
                                    label="Trip Fare"
                                    className="w-full"
                                />
                            </div>

                            <div className="flex flex-row space-x-2 items-center">
                                <NumberInput
                                    value={selectedDriverRequest?.fare?.food}
                                    disabled
                                    label="Food Fare"
                                    className="w-full"
                                />
                            </div>

                            <div className="flex flex-row space-x-2 items-center">
                                <NumberInput
                                    value={selectedDriverRequest?.fare?.gas}
                                    disabled
                                    label="Gas Fare"
                                    className="w-full"
                                />
                            </div>

                            <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Total Fare: ${selectedDriverRequest?.fare?.aggregated}</h1>
                        </div>
                        

                        <div className="flex flex-row space-x-4">
                            <Button
                                color="danger"
                                className="w-full mt-4"
                                onPress={() => {
                                    fetch(`${fetchBase}/v1/trip/${trip_uuid}/rider/request/reject/${selectedDriverRequest?.user_uuid}`, {
                                        method: "POST",
                                        credentials: "include",
                                        headers: {
                                            "Content-Type": "application/json",
                                            'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                                            'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
                                        }
                                    }).then((res) => res.json()).then((data) => {
                                        if(data.success) {
                                            setSelectedDriverRequest(null);
                                            setTrip(data.trip);
                                        } else {
                                            addToast({
                                                title: "Error",
                                                description: data.error,
                                            })
                                        }
                                    }).catch((err) => {
                                        addToast({
                                            title: "Error",
                                            description: "An error occurred while rejecting the driver request.",
                                        })
                                    })
                                }}
                            >
                                Reject Request
                            </Button>
                            <Button
                                onClick={() => {
                                    fetch(`${fetchBase}/v1/trip/${trip_uuid}/rider/request/accept/${selectedDriverRequest?.user_uuid}`, {
                                        method: "POST",
                                        credentials: "include",
                                        headers: {
                                            "Content-Type": "application/json",
                                            'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                                            'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
                                        }
                                    }).then((res) => res.json()).then((data) => {
                                        if(data.success) {
                                            setSelectedDriverRequest(null);
                                            setTrip(data.trip);
                                            fetch(`${fetchBase}/v1/trip/${trip_uuid}/rflow/driver?flow_type=assigned`, {
                                                credentials: "include",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                                                    'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
                                                }
                                            }).then((res) => res.json()).then((data) => {
                                                if(data.success) {
                                                    setDriverProfile(data.driver[0]);
                                                } else {
                                                    addToast({
                                                        title: "Error",
                                                        description: data.error,
                                                    })
                                                }
                                            }).catch((err) => {
                                                addToast({
                                                    title: "Error",
                                                    description: "An error occurred while fetching the driver profile.",
                                                })
                                            })
                                        } else {
                                            addToast({
                                                title: "Error",
                                                description: data.error,
                                            })
                                        }
                                    }).catch((err) => {
                                        addToast({
                                            title: "Error",
                                            description: "An error occurred while accepting the driver request.",
                                        })
                                    })
                                }}
                                color="primary"
                                className="w-full mt-4"
                            >
                                Accept Request
                            </Button>
                        </div>

                    </div>
                </div>
            )
        }

        {
            confirmRemoveDriver && ( 
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="flex flex-col bg-white dark:bg-neutral-900 p-4 rounded-xl">
                        <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">
                            Remove Driver
                        </h1>

                        <p className="text-black dark:text-white font-RobotoRegular text-sm">
                            Are you sure you want to remove this driver from the trip?
                        </p>

                        <div className="flex flex-row space-x-4">
                            <Button
                                color="default"
                                className="w-full mt-4"
                                onPress={() => setConfirmRemoveDriver(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                color="danger"
                                className="w-full mt-4"
                                onPress={() => {
                                    removeDriver();
                                }}
                            >
                                Confirm Removal
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }
        </div>
    )
}

export default RiderFlowCreatedTrip;

// fdsfdssfsf