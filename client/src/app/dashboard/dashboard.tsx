import React, { useState, useEffect } from 'react';
import fetchBase from '../../common/fetchBase';
import { Input } from '@heroui/react';
import { Settings, Bell } from 'lucide-react';
import { AccountData } from '../view_controller';

interface DashboardProps {
    accountData: AccountData;
}

const Dashboard: React.FC<DashboardProps> = ({ accountData }) => {

    const [searchQuery, setSearchQuery] = useState<string>("");

    return (
        <div className="flex flex-col space-y-8 bg-white dark:bg-black min-h-screen p-8">
            <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center space-x-4">
                    <img src="https://static-00.iconduck.com/assets.00/profile-default-icon-512x511-v4sw4m29.png"
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
        </div>
    );
}

export default Dashboard