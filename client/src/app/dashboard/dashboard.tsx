import React, { useState, useEffect } from 'react';
import fetchBase from '../../common/fetchBase';
import { cn, Input } from '@heroui/react';
import { Settings, Bell } from 'lucide-react';
import { AccountData } from '../view_controller';
import {Alert, Button} from "@heroui/react";
import RecommendedActions from './recommended_actions';
import {Tabs, Tab, Card, CardBody} from "@heroui/react";


interface DashboardProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const Dashboard: React.FC<DashboardProps> = ({ accountData, setAccountData }) => {

    const [searchQuery, setSearchQuery] = useState<string>("");

    return (
        <div className="flex flex-col space-y-8 bg-white dark:bg-black min-h-screen p-8">
            <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center space-x-4">
                    <img src={accountData.profile_picture}
                     className="h-16 w-16 rounded-full" />
                    <div className="flex flex-col ">
                        <h1 className="text-black dark:text-white text-xl font-RobotoSemiBold">Welcome, {accountData?.first_name} {accountData?.last_name}</h1>
                        <h2 className="text-black dark:text-white text-sm font-RobotoRegular">{new Date().toDateString()}</h2>
                    </div>
                </div>

                <div className="flex flex-row items-center space-x-2">
                    <Input
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="light dark:dark rounded-full w-72"
                        radius="full"
                    />
                    <button className="bg-green-600 hover:bg-green-700 dark:bg-gator-translucent hover:bg-gator-translucent2 p-3 rounded-full">
                        <Settings
                        className="text-white"
                        size={24} />
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 dark:bg-gator-translucent hover:bg-gator-translucent2 p-3 rounded-full">
                        <Bell
                        className="text-white"
                        size={24} />
                    </button>
                </div>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <div className="flex flex-col bg-green-600 dark:bg-gator-translucent p-4 rounded-xl h-32">
                    <h1 className="text-white font-RobotoSemiBold text-2xl">Past Trips</h1>
                </div>
                <div className="flex flex-col bg-green-600 dark:bg-gator-translucent p-4 rounded-xl h-32">
                    <h1 className="text-white font-RobotoSemiBold text-2xl">Past Trips</h1>
                </div>
                <div className="flex flex-col bg-green-600 dark:bg-gator-translucent p-4 rounded-xl h-32">
                    <h1 className="text-white font-RobotoSemiBold text-2xl">Past Trips</h1>
                </div>
                <div className="flex flex-col bg-green-600 dark:bg-gator-translucent p-4 rounded-xl h-32">
                    <h1 className="text-white font-RobotoSemiBold text-2xl">Past Trips</h1>
                </div>
            </div>

            {
                accountData?.status_cards && accountData?.status_cards.length > 0 && (
                    <RecommendedActions statusCards={accountData.status_cards}
                    setAccountData={setAccountData}
                    />
                )
            }

        <div className="flex w-full flex-col">
            <Tabs aria-label="Options">
                <Tab key="photos" title="Photos">
                <Card>
                    <CardBody>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                    exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </CardBody>
                </Card>
                </Tab>
                <Tab key="music" title="Music">
                <Card>
                    <CardBody>
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
                    ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                    cillum dolore eu fugiat nulla pariatur.
                    </CardBody>
                </Card>
                </Tab>
                <Tab key="videos" title="Videos">
                <Card>
                    <CardBody>
                    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                    mollit anim id est laborum.
                    </CardBody>
                </Card>
                </Tab>
            </Tabs>
            </div>
        </div>
    );
}

export default Dashboard