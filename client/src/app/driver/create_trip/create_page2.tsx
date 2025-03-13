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


interface CreatePage2Props {
    tripOptions?: CreateTripDriverFlowOptionsEntity;
    setTripOptions: React.Dispatch<React.SetStateAction<CreateTripDriverFlowOptionsEntity>>;
    accountData: AccountData;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

const CreatePage2: React.FC<CreatePage2Props> = ({ tripOptions, setTripOptions, accountData, setCurrentPage }) => {

    const [agreedToPaymentTerms, setAgreedToPaymentTerms] = useState<boolean>(false);

    return (
        <div className="flex flex-col w-full gap-4 h-full">
            <div className="flex flex-col h-full ">
                <h1 className="font-RobotoBold text-xl text-black dark:text-white">
                    Set Fare Price
                </h1>
                <p className="font-RobotoRegular text-sm max-w-md text-black dark:text-white">
                    Set the price for your trip. This will be the price that passengers will pay for different aspects of the trip.
                    By default, there are 3 prices for trip, gas, and food. You may leave any field blank
                    which will be shown on the rider feed. GatorPool does not handle payments. It is between you and
                    the driver to handle payments.
                </p>

                <Input
                    type="number"
                    placeholder="Trip Price"
                    label="Trip"
                    value={"" + tripOptions?.fare?.trip}
                    onChange={(e) => {
                        setTripOptions((prev) => ({
                            ...prev,
                            fare: {
                                ...prev.fare,
                                trip: parseFloat(e.target.value),
                            },
                        }));
                    }}
                    className="mt-4 max-w-sm"
                />
                <p className="font-RobotoRegular text-xs max-w-sm text-neutral-500">
                    This is the fare price for the actual trip. Riders will be able to view this.
                </p>

                <Input
                    type="number"
                    placeholder="Gas Price"
                    label="Gas"
                    value={"" + tripOptions?.fare?.gas}
                    onChange={(e) => {
                        setTripOptions((prev) => ({
                            ...prev,
                            fare: {
                                ...prev.fare,
                                gas: parseFloat(e.target.value),
                            },
                        }));
                    }}
                    className="mt-4 max-w-sm"
                />
                <p className="font-RobotoRegular text-xs max-w-sm text-neutral-500">
                    This is the fare price for gas. Riders will be able to view this.
                </p>

                <Input
                    type="number"
                    placeholder="Food Price"
                    label="Food"
                    value={"" + tripOptions?.fare?.food}
                    onChange={(e) => {
                        setTripOptions((prev) => ({
                            ...prev,
                            fare: {
                                ...prev.fare,
                                food: parseFloat(e.target.value),
                            },
                        }));
                    }}
                    className="mt-4 max-w-sm"
                />
                <p className="font-RobotoRegular text-xs max-w-sm text-neutral-500">
                    This is the fare price for food. Riders will be able to view this.
                </p>
                
                <div className="flex flex-row mt-12">
                    <Checkbox isSelected={tripOptions?.fare?.accepted_terms} onValueChange={(value) => {
                        setTripOptions((prev) => ({
                            ...prev,
                            fare: {
                                ...prev.fare,
                                accepted_terms: value,
                            },
                        }));
                    }
                    }>

                    </Checkbox>
                    <p className="font-RobotoRegular text-sm max-w-sm text-black dark:text-white">
                        I agree that payment handling is between me and the rider.
                    </p>
                </div>

                <div className="flex flex-row w-full mt-auto ml-auto space-x-4">
                    <Button
                        className="ml-auto "
                        color="default"
                        onClick={() => {
                            setCurrentPage(1);
                        }}
                    >
                        Previous
                    </Button>
                    <Button
                        className=""
                        color="primary"
                        onClick={() => {
                            if(!tripOptions?.fare?.accepted_terms) {
                                console.log("tripOptions", tripOptions);
                                alert("You must agree to the payment terms to continue.");
                                return;
                            }
                            setCurrentPage(3);
                        }}
                    >
                        Next
                    </Button>
                </div>
            </div>


        </div>
    )
}

export default CreatePage2