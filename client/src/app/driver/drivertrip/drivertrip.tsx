import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import fetchBase from '../../../common/fetchBase';
import { TripEntity } from '../../../common/types/trip_entity';
import { AccountData } from '../../view_controller';
import { Button, Checkbox, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { ArrowLeft, Pencil, Save, Check, X } from 'lucide-react';
import { NumberInput, addToast } from '@heroui/react';

interface DriverTripProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const DriverTrip: React.FC<DriverTripProps> = ({ accountData, setAccountData }) => {

    const { trip_uuid } = useParams();
    const navigate = useNavigate();

    const [trip, setTrip] = useState<TripEntity | null>(null);
    const [tripCopy, setTripCopy] = useState<TripEntity | null>(null);

    const [editFareTrip, setEditFareTrip] = useState<boolean>(false);
    const [editFareFood, setEditFareFood] = useState<boolean>(false);
    const [editFareGas, setEditFareGas] = useState<boolean>(false);

    const [editMusicPreference, setEditMusicPreference] = useState<boolean>(false);
    const [editAcPreference, setEditAcPreference] = useState<boolean>(false);
    const [editConversatingPreference, setEditConversatingPreference] = useState<boolean>(false);

    const [editCarpoolingPreference, setEditCarpoolingPreference] = useState<boolean>(false);

    const [confirmCancelTrip, setConfirmCancelTrip] = useState<boolean>(false);

    useEffect(() => {
        fetch(`${fetchBase}/v1/driver/trips/${trip_uuid}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
            }
        }).then(res => res.json()).then(data => {
            if(data.success) {
                setTrip(data.trip);
                setTripCopy(data.trip);
            }
        }).catch(err => {
            console.error(err);
        });
    }, []);

    const saveTrip = () => {
        fetch(`${fetchBase}/v1/trip/${trip_uuid}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
            },
            body: JSON.stringify({
                trip: tripCopy
            })
        }).then(res => res.json()).then(data => {
            if(data.success) {
                setTrip(data.trip);
                setTripCopy(data.trip);
            } else {
                addToast({
                    title: "Error",
                    description: data.error,
                    color: "danger"
                });
            }
        }).catch(err => {
            console.error(err);
        });
    }

    useEffect(() => {
        setTripCopy({
            ...tripCopy,
            fare: { ...tripCopy?.fare, aggregated: tripCopy?.fare?.food + tripCopy?.fare?.gas + tripCopy?.fare?.trip }
        });
        
    }, [tripCopy?.fare?.food, tripCopy?.fare?.gas, tripCopy?.fare?.trip]);

    return (
        <div className="flex flex-col bg-white dark:bg-black space-y-4 h-screen overflow-y-auto p-8">
            <div className="flex flex-row space-x-4 items-center">
                <button onClick={() => navigate('/my-trips')} className="flex items-center justify-center bg-gray-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 rounded-full p-2">
                    <ArrowLeft className="w-8 h-8 text-black dark:text-white" />
                </button>
                <h1 className="text-2xl lg:text-4xl font-RobotoBold text-black dark:text-white">
                    Your trip to {trip?.waypoints.find(waypoint => waypoint.type === "destination")?.geo_text}
                </h1>
                <div className="flex flex-row space-x-2 items-center">
                    {
                        trip?.status === "cancelled" ? (
                            <div className="flex items-center justify-center bg-red-700 text-white rounded-full px-4 py-2">
                                <p className="text-sm font-RobotoBold">Cancelled</p>
                            </div>
                        ) : (
                            new Date(trip?.datetime) > new Date() && (
                                <div className="flex items-center justify-center bg-green-700 text-white rounded-full px-4 py-2">
                                    <p className="text-sm font-RobotoBold">Upcoming</p>
                                </div>
                            )
                        )
                    }
                </div>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-3  lg:grid-cols-4">
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
                <div className="flex flex-col bg-gray-200 dark:bg-neutral-900 p-4 rounded-xl h-32">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Riders</h1>
                    <p className="text-black dark:text-white font-RobotoBold text-3xl">
                        {trip?.riders?.length || 0}
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
                <div className="flex flex-col min-h-[20rem] lg:h-full w-full lg:w-8/12 bg-gray-200 dark:bg-neutral-900 rounded-xl p-6">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Trip Summary</h1>

                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Fare Details</h1>
                    <div className="flex flex-col space-y-2">
                    <div className="flex flex-row space-x-2 items-center">
                       <NumberInput
                            value={tripCopy?.fare?.trip}
                            onValueChange={(value) => {
                                setTripCopy({
                                    ...tripCopy,
                                    fare: {
                                        ...tripCopy?.fare,
                                        trip: value
                                    }
                                });
                            }}
                            disabled={!editFareTrip}
                            label="Trip Fare"
                            className="w-full"
                        />
                        <Button
                        isIconOnly
                            onPress={() => {
                                if(editFareTrip) {
                                    saveTrip();
                                }
                                setEditFareTrip(!editFareTrip);
                            }}
                            className="p-1 rounded-full"
                        >
                            {editFareTrip ? <Save className="w-4 h-4 text-black dark:text-white" /> : <Pencil className="w-4 h-4 text-black dark:text-white" />}
                        </Button>
                    </div> 

                    <div className="flex flex-row space-x-2 items-center">
                       <NumberInput
                            value={tripCopy?.fare?.food}
                            onValueChange={(value) => {
                                setTripCopy({
                                    ...tripCopy,
                                    fare: {
                                        ...tripCopy?.fare,
                                        food: value
                                    }
                                });
                            }}
                            disabled={!editFareFood}
                            label="Food Fare"
                            className="w-full"
                        />
                        <Button
                        isIconOnly
                            onPress={() => {
                                if(editFareTrip) {
                                    saveTrip();
                                }
                                setEditFareFood(!editFareFood);
                            }}
                            className="p-1 rounded-full"
                        >
                            {editFareFood ? <Save className="w-4 h-4 text-black dark:text-white" /> : <Pencil className="w-4 h-4 text-black dark:text-white" />}
                        </Button>
                    </div> 

                    <div className="flex flex-row space-x-2 items-center">
                       <NumberInput
                            value={tripCopy?.fare?.gas}
                            onValueChange={(value) => {
                                setTripCopy({
                                    ...tripCopy,
                                    fare: {
                                        ...tripCopy?.fare,
                                        gas: value
                                    }
                                });
                            }}
                            disabled={!editFareGas}
                            label="Gas Fare"
                            className="w-full"
                        />
                        <Button
                        isIconOnly
                            onPress={() => {
                                if(editFareTrip) {
                                    saveTrip();
                                }
                                setEditFareGas(!editFareGas);
                            }}
                            className="p-1 rounded-full"
                        >
                            {editFareGas ? <Save className="w-4 h-4 text-black dark:text-white" /> : <Pencil className="w-4 h-4 text-black dark:text-white" />}
                            </Button>
                        </div>

                        <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Aggregated Fare: ${tripCopy?.fare?.aggregated}</h1>
                    </div>

                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Preferences</h1>
                    <div className="flex flex-col space-y-2">
                        <div className="flex flex-row space-x-2 items-center">
                            <Checkbox
                                isDisabled={!editMusicPreference}
                                isSelected={tripCopy?.miscellaneous?.music.can_be_controlled}
                                onValueChange={(checked) => {
                                    setTripCopy({
                                        ...tripCopy,
                                        miscellaneous: {
                                            ...tripCopy?.miscellaneous,
                                            music: {
                                                ...tripCopy?.miscellaneous?.music,
                                                can_be_controlled: checked
                                            }
                                        }
                                    });
                                }}
                            />
                            <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                Passengers can control or request music
                            </p>
                            <Button
                                isIconOnly
                                className="p-1 rounded-full"
                                onPress={() => {
                                    if(editMusicPreference) {
                                        saveTrip();
                                    }
                                    setEditMusicPreference(!editMusicPreference);
                                }}
                            >
                                {editMusicPreference ? <Save className="w-4 h-4 text-black dark:text-white" /> : <Pencil className="w-4 h-4 text-black dark:text-white" />}
                            </Button>
                        </div>

                        <div className="flex flex-row space-x-2 items-center">
                            <Checkbox
                                isDisabled={!editAcPreference}
                                isSelected={tripCopy?.miscellaneous?.ac.can_be_controlled}
                                onValueChange={(checked) => {
                                    setTripCopy({
                                        ...tripCopy,
                                        miscellaneous: {
                                            ...tripCopy?.miscellaneous,
                                            ac: {
                                                ...tripCopy?.miscellaneous?.ac,
                                                can_be_controlled: checked
                                            }
                                        }
                                    });
                                }}
                            />
                            <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                Passengers can control or request AC
                            </p>
                            <Button
                                isIconOnly
                                className="p-1 rounded-full"
                                onPress={() => {
                                    if(editAcPreference) {
                                        saveTrip();
                                    }
                                    setEditAcPreference(!editAcPreference);
                                }}
                            >
                                {editAcPreference ? <Save className="w-4 h-4 text-black dark:text-white" /> : <Pencil className="w-4 h-4 text-black dark:text-white" />}
                            </Button>
                        </div>

                        <div className="flex flex-row space-x-2 items-center">
                            {
                                editConversatingPreference ? (
                                    <Dropdown 
                                    className="light:light dark:dark"
                                    >
                                    <DropdownTrigger>
                                        <Button className="capitalize" variant="bordered">
                                        {
                                            tripCopy?.miscellaneous?.talking.type
                                        }
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        disallowEmptySelection
                                        aria-label="Single selection example"
                                        selectionMode="single"
                                        variant="flat"
                                        className="light:light dark:dark"
                                        onSelectionChange={(selected) => {
                                            // Convert Set to an array and get the first selected item
                                            const selectedValue = Array.from(selected)[0] as string;
                
                                            setTripCopy((prev) => ({
                                                ...prev,
                                                miscellaneous: {
                                                    ...prev?.miscellaneous,
                                                    talking: {
                                                        ...prev?.miscellaneous?.talking,
                                                        type: selectedValue
                                                    }
                                                }
                                            }));
                
                                            console.log(selectedValue);
                                        }}
                                    >
                                        <DropdownItem key="open" className="text-black dark:text-white">Open</DropdownItem>
                                        <DropdownItem key="minimal" className="text-black dark:text-white">Minimal</DropdownItem>
                                        <DropdownItem key="silent" className="text-black dark:text-white">Silent</DropdownItem>
                                    </DropdownMenu>
                                    </Dropdown>
                                ) : (
                                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                        Talking preference: {tripCopy?.miscellaneous?.talking.type}
                                    </p>
                                )
                            }
                            <Button
                                isIconOnly
                                className="p-1 rounded-full"
                                onPress={() => {
                                    if(editConversatingPreference) {
                                        saveTrip();
                                    }
                                    setEditConversatingPreference(!editConversatingPreference);
                                }}
                            >
                                {editConversatingPreference ? <Save className="w-4 h-4 text-black dark:text-white" /> : <Pencil className="w-4 h-4 text-black dark:text-white" />}
                            </Button>
                        </div>
                    </div>

                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Carpooling</h1>
                    <div className="flex flex-row space-x-2 items-center">
                        <Checkbox
                            isDisabled={!editCarpoolingPreference}
                            isSelected={tripCopy?.carpool}
                            onValueChange={(checked) => {
                                setTripCopy({
                                    ...tripCopy,
                                    carpool: checked
                                });
                            }}
                        />
                        <p className="text-black dark:text-white font-RobotoRegular text-sm">
                            Carpooling
                        </p>
                        <Button
                            isIconOnly
                            className="p-1 rounded-full"
                            onPress={() => {
                                if(editCarpoolingPreference) {
                                    saveTrip();
                                }
                                // check if changing to true
                                if(tripCopy?.carpool) {
                                    if(tripCopy?.riders?.length > 0) {
                                        addToast({
                                            title: "More than 1 passenger",
                                            description: "More than 1 passenger is already attending. You may remove them or cancel the trip.",
                                            color: "danger"
                                        });
                                        return;
                                    }
                                }
                                setEditCarpoolingPreference(!editCarpoolingPreference);
                            }}
                        >
                            {editCarpoolingPreference ? <Save className="w-4 h-4 text-black dark:text-white" /> : <Pencil className="w-4 h-4 text-black dark:text-white" />}
                        </Button>
                    </div>

                    <h1 className="text-red-500 font-RobotoSemiBold text-lg mt-4">
                        Danger Zone
                        <br></br>
                        <span className="text-red-500 font-RobotoRegular text-sm">
                            Actions done here are irreversible and may affect your account. You may cancel trips up to 3 days before the trip.
                        </span>
                    </h1>

                    {
                        !confirmCancelTrip && (
                            <Button
                                color="danger"
                                className="w-48"
                        onPress={() => {
                            setConfirmCancelTrip(true);
                        }}
                    >
                                Cancel Trip
                            </Button>
                        )
                    }
                    {
                        confirmCancelTrip && (
                            <div className="flex flex-col space-y-2">
                                <Button
                                    color="danger"
                                    className="w-48"
                                    onPress={() => {
                                        setConfirmCancelTrip(false);
                                        fetch(`${fetchBase}/v1/trip/${trip_uuid}`, {
                                            method: 'DELETE',
                                            credentials: 'include',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                                                'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
                                            }
                                        }).then(res => res.json()).then(data => {
                                            if(data.success) {
                                                setTrip(data.trip);
                                                setTripCopy(data.trip);
                                                if(data.issue_warning) {
                                                    addToast({
                                                        title: "Trip cancelled",
                                                        description: "The trip has been cancelled. You will receive a warning on your account.",
                                                        color: "danger"
                                                    });
                                                } else {
                                                    addToast({
                                                        title: "Trip cancelled",
                                                        description: "The trip has been cancelled with no penalty.",
                                                        color: "success"
                                                    });
                                                }
                                            } else {
                                                addToast({
                                                    title: "Error",
                                                    description: data.error,
                                                    color: "danger"
                                                });
                                            }
                                        }).catch(err => {
                                            addToast({
                                                title: "Error",
                                                description: "An error occured.",
                                                color: "danger"
                                            });
                                        });
                                    }}
                                >
                                    Confirm
                                </Button>
                                <p className="text-red-500 font-RobotoRegular text-sm">
                                    Are you sure you want to cancel this trip? This action is irreversible and you will receive a warning on your account. Multiple warnings can lead to a temporary or permanent ban.
                                </p>
                            </div>
                        )
                    }
                </div>
                <div className="flex flex-col min-h-[20rem] lg:h-full w-full lg:w-4/12 bg-gray-200 dark:bg-neutral-900 rounded-xl p-4">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Passengers</h1>
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Accepted ({trip?.riders?.filter(rider => rider.accepted).length || 0})</h1>
                    <div className="flex flex-col space-y-2 max-h-80 w-full overflow-y-auto ">
                        {
                            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(() => (
                                <div className="flex flex-row items-center justify-between bg-gray-100 dark:bg-neutral-800 p-4 rounded-xl">
                                <div className="flex flex-col">
                                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                        Mustafa Masody
                                    </p>
                                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                        {new Date().toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex flex-row items-center space-x-2">
                                    <Button className="p-1 rounded-full"  isIconOnly onPress={() => {
                                    }}>
                                        <Pencil className="w-4 h-4 text-black dark:text-white" />
                                    </Button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-lg mt-4">Requests ({trip?.riders?.filter(rider => !rider.accepted).length || 0})</h1>
                    <div className="flex flex-col space-y-2 max-h-80 w-full overflow-y-auto ">
                        {
                            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(() => (
                                <div className="flex flex-row items-center justify-between bg-gray-100 dark:bg-neutral-800 p-4 rounded-xl">
                                <div className="flex flex-col">
                                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                        Mustafa Masody
                                    </p>
                                    <p className="text-black dark:text-white font-RobotoRegular text-sm">
                                        {new Date().toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex flex-row items-center space-x-2">
                                    <Button className="p-1 rounded-full"  isIconOnly onPress={() => {
                                    }}>
                                        <X className="w-4 h-4 text-black dark:text-white" />
                                    </Button>
                                    <Button className="p-1 rounded-full" isIconOnly onPress={() => {
                                    }}>
                                        <Check className="w-4 h-4 text-black dark:text-white" />
                                    </Button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DriverTrip;