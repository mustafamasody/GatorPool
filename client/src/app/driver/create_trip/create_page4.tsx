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

interface CreatePage4Props {
    tripOptions?: CreateTripDriverFlowOptionsEntity;
    setTripOptions: React.Dispatch<React.SetStateAction<CreateTripDriverFlowOptionsEntity>>;
    accountData: AccountData;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

const CreatePage4: React.FC<CreatePage4Props> = ({ tripOptions, setTripOptions, accountData, setCurrentPage }) => {
        
    return (
            <div className="flex flex-col w-full gap-4 h-full">
                <div className="flex flex-col w-full h-full overflow-y-auto">
                <h1 className="font-RobotoBold text-xl text-black dark:text-white">
                    Carpooling
                </h1>
                <p className="font-RobotoRegular text-sm max-w-md text-black dark:text-white">
                    Check the box below if you want to have more than one passenger on this trip. {" "}
                    Carpooling is a great way to save money and is apart of GatorPool's mission to reduce carbon emissions. {" "}
                    Safety features will be available to all passengers during the trip, as well as the driver.
                </p>
                    <div className="flex flex-row mt-4">
                        <Checkbox isSelected={tripOptions?.carpool} onValueChange={(value) => {
                            setTripOptions((prev) => ({
                                ...prev,
                                carpool: value,
                            }));
                        }}></Checkbox>
                        <p className="font-RobotoRegular text-sm max-w-sm text-black dark:text-white">
                            Carpool
                        </p>
                    </div>
                </div>
                <div className="flex flex-row w-full mt-auto ml-auto space-x-4">
                    <Button
                        className="ml-auto "
                        color="default"
                        onClick={() => {
                            setCurrentPage(3);
                        }}
                    >
                        Previous
                    </Button>
                    <Button
                        className=""
                        color="primary"
                        onClick={() => {
                            setCurrentPage(5);
                        }}
                    >
                        Next
                    </Button>
                </div>
            </div>
    );
};

export default CreatePage4;