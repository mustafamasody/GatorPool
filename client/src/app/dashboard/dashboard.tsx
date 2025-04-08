import React, { useState, useEffect } from 'react';
import fetchBase from '../../common/fetchBase';
import { cn, Input } from '@heroui/react';
import { Settings, Bell, MoveRight } from 'lucide-react';
import { AccountData } from '../view_controller';
import {Alert, Button} from "@heroui/react";
import RecommendedActions from './recommended_actions';
import {Tabs, Tab, Card, CardBody} from "@heroui/react";
import { useNavigate } from 'react-router-dom';


interface DashboardProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const Dashboard: React.FC<DashboardProps> = ({ accountData, setAccountData }) => {

    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState<string>("");

    return (
        <div className="flex flex-col space-y-8 bg-white dark:bg-[#0c0c0c] min-h-screen p-8">
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
                        className="hidden lg:block light dark:dark rounded-full w-72"
                        radius="full"
                    />
                    <button className="bg-green-600 hover:bg-green-700 dark:bg-gator-translucent hover:bg-gator-translucent2 p-3 rounded-full">
                        <Bell
                        className="text-white"
                        size={24} />
                    </button>
                </div>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                <div className="flex flex-col bg-slate-100 dark:bg-neutral-900 p-4 rounded-xl h-32">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Upcoming Trips</h1>
                    <h1 className="text-black dark:text-white font-RobotoRegular text-lg">{accountData?.dashboard_stats?.upcoming_trips}</h1>
                </div>
                <div className="flex flex-col bg-slate-100 dark:bg-neutral-900 p-4 rounded-xl h-32">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Past Trips</h1>
                    <h1 className="text-black dark:text-white font-RobotoRegular text-lg">{accountData?.dashboard_stats?.past_trips}</h1>
                </div>
                <div className="flex flex-col bg-slate-100 dark:bg-neutral-900 p-4 rounded-xl h-32">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Account Type</h1>
                    <h1 className="text-black dark:text-white font-RobotoRegular text-lg">{accountData?.dashboard_stats?.account_type}</h1>
                </div>
                {/* <div className="flex flex-col bg-slate-100 dark:bg-neutral-900 p-4 rounded-xl h-32">
                    <h1 className="text-black dark:text-white font-RobotoSemiBold text-2xl">Past Trips</h1>
                </div> */}
            </div>

            {
                accountData?.status_cards && accountData?.status_cards.length > 0 && (
                    <RecommendedActions statusCards={accountData.status_cards}
                    setAccountData={setAccountData}
                    />
                )
            }

            <div className="flex flex-col w-full">
                <h1 className="text-black mb-4 dark:text-white text-2xl font-RobotoSemiBold">Feed</h1>
                <div className="grid w-full grid-cols-1 lg:grid-cols-3 gap-8">
                    {
                        accountData?.bottom_actions?.map((action, index) => (
                            <div
                            key={action.uuid}
                            className={`
                            ${action.color === "default" ? " bg-neutral-800 text-black dark:text-white " :
                                action.color === "orange_gradient" ? " text-white bg-gradient-to-r from-orange-400 to-rose-800 "
                                :
                                action.color === "green_gradient" ? " text-white bg-gradient-to-r from-green-400 to-emerald-800 " 
                                : " bg-neutral-800 text-black dark:text-white "
                            }
                            w-full h-[28rem] rounded-2xl p-6 relative col-span-1`}>
                                <h1 className="text-white font-RobotoSemiBold text-2xl">{action.title}</h1>
                                <p className="text-white font-RobotoRegular text-lg">{action.description}</p>

                                <Button
                                endContent={<MoveRight size={14} />}
                                onPress={() => {
                                    if(action.action === "book_trip_flow") {
                                        navigate("/find-ride");
                                    } else if(action.action === "book_trip") {
                                        navigate("/find-ride");
                                    }
                                }}
                                className="absolute bottom-6 bg-opacity-50 right-6 text-white font-RobotoRegular"
                                size="md"
                                >
                                    {action.action_name}
                                </Button>

                                <img src={action.display_blob} className="absolute bottom-2 left-2 h-48 w-48" />
                            </div>
                        ))
                    }
                </div>
            </div>

        </div>
    );
}

export default Dashboard