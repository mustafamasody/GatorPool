import React, { useState, useEffect, useRef } from 'react';
import { AccountData } from '../../view_controller';
import { Button, Input } from '@heroui/react';
import {DatePicker} from "@heroui/react";
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem} from "@heroui/react";
import {parseDate, getLocalTimeZone} from "@internationalized/date";
import fetchBase from '../../../common/fetchBase';
import {now, parseAbsoluteToLocal, today} from "@internationalized/date";
import mapboxgl from 'mapbox-gl';
import { Feature, Polygon } from "geojson";
import { CreateTripDriverFlowOptionsEntity } from '../types';
import {Checkbox} from "@heroui/react";

interface CreatePage3Props {
    tripOptions?: CreateTripDriverFlowOptionsEntity;
    setTripOptions: React.Dispatch<React.SetStateAction<CreateTripDriverFlowOptionsEntity>>;
    accountData: AccountData;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

const CreatePage3: React.FC<CreatePage3Props> = ({ tripOptions, setTripOptions, accountData, setCurrentPage }) => {

    const [isFemale, setFemale] = useState<boolean>(false);

    useEffect(() => {
        fetch(fetchBase + "/v1/driver/gender", {
            method: "GET",
            credentials: "include",
            headers: {
                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
                'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username'),
            },
        }).then(res => res.json()).then(data => {
            if(data.success) {
                setFemale(data?.gender === "female");
            }
        }).catch(err => {
            console.error(err);
            alert("Error on request: " + err)
        })
    }, []);

    return (
            <div className="flex flex-col w-full gap-4 h-full">
                <div className="flex flex-col max-h-[28rem] ">
                    <h1 className="font-RobotoBold text-xl text-black dark:text-white">
                        Preferences
                    </h1>
                </div>
                <h1 className="font-RobotoBold text-l text-black dark:text-white mt-4">
                    Music
                </h1>
                <div className="flex flex-row">
                    <Checkbox isSelected={tripOptions?.music_preferences?.can_be_controlled} onValueChange={(value) => {
                        setTripOptions((prev) => ({
                            ...prev,
                            music_preferences: {
                                ...prev.music_preferences,
                                can_be_controlled: value,
                            },
                        }));
                    }}>

                    </Checkbox>
                    <p className="font-RobotoRegular text-sm max-w-sm text-black dark:text-white">
                        Rider can change or request music on the trip.
                    </p>
                </div>
                <h1 className="font-RobotoBold text-l text-black dark:text-white mt-4">
                    Air Conditioning
                </h1>
                <div className="flex flex-row">
                    <Checkbox isSelected={tripOptions?.ac_preferences?.can_be_controlled} onValueChange={(value) => {
                        setTripOptions((prev) => ({
                            ...prev,
                            ac_preferences: {
                                ...prev.ac_preferences,
                                can_be_controlled: value,
                            },
                        }));
                    }}>

                    </Checkbox>
                    <p className="font-RobotoRegular text-sm max-w-sm text-black dark:text-white">
                        Rider can change or request to change the car AC.
                    </p>
                </div>
                <h1 className="font-RobotoBold text-l text-black dark:text-white mt-4">
                    Conversating
                </h1>
                <div className="flex flex-row">
                <Dropdown>
                    <DropdownTrigger>
                        <Button className="capitalize" variant="bordered">
                        {
                            tripOptions?.talking_preferences?.silent ? "Silent" : tripOptions?.talking_preferences?.minimal ? "Minimal" : "Open"
                        }
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                        disallowEmptySelection
                        aria-label="Single selection example"
                        selectionMode="single"
                        variant="flat"
                        onSelectionChange={(selected) => {
                            // Convert Set to an array and get the first selected item
                            const selectedValue = Array.from(selected)[0];

                            setTripOptions((prev) => ({
                                ...prev,
                                talking_preferences: {
                                    silent: selectedValue === "silent",
                                    minimal: selectedValue === "minimal",
                                    requests: {},
                                },
                            }));

                            console.log(selectedValue);
                        }}
                    >
                        <DropdownItem key="open">Open</DropdownItem>
                        <DropdownItem key="minimal">Minimal</DropdownItem>
                        <DropdownItem key="silent">Silent</DropdownItem>
                    </DropdownMenu>
                    </Dropdown>

                </div>

                {
                        isFemale && (
                            <>
                                <h1 className="font-RobotoBold text-l text-black dark:text-white mt-4">
                                    Gender Preference
                                </h1>
                                
                                {/* Checkbox for Females Only */}
                                <div className="flex flex-row">
                                    <Checkbox isSelected={tripOptions?.rider_requirements?.females_only} onValueChange={(value) => {
                                        setTripOptions((prev) => ({
                                            ...prev,
                                            rider_requirements: {
                                                ...prev.rider_requirements,
                                                females_only: value,
                                            },
                                        }));
                                    }}>

                                    </Checkbox>
                                
                                    <p className="font-RobotoRegular text-sm max-w-sm text-black dark:text-white">
                                        Restrict your requests to only females.
                                    </p>
                                </div>
                            </>
                        )
                    }

                <div className="flex flex-row w-full mt-auto ml-auto space-x-4">
                    <Button
                        className="ml-auto "
                        color="default"
                        onClick={() => {
                            setCurrentPage(2);
                        }}
                    >
                        Previous
                    </Button>
                    <Button
                        className=""
                        color="primary"
                        onClick={() => {
                            setCurrentPage(4);
                        }}
                    >
                        Next
                    </Button>
                </div>
            </div>
    );
};

export default CreatePage3;