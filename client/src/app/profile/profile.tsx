import React, { useState, useEffect } from 'react'
import { Textarea, Button} from '@heroui/react';
import { AccountData } from '../view_controller';

interface ViewProfileProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const ViewProfile: React.FC<ViewProfileProps> = ({ accountData, setAccountData }) => {

    const [bio, setBio] = useState<string>("");

    return(
        <div className="flex flex-col min-h-screen">
            <div className="flex bg-white dark:bg-black p-8 items-center">
                <div className="flex flex-col items-center space-y-8 mr-16">
                    <div className="flex flex-row items-center">
                        <div className="flex flex-row items-center space-x-4 mt-32">
                            <button onClick={()=> console.log("Profile picture clicked!")}>
                                <img src={accountData.profile_picture}
                                className="h-32 w-32 rounded-full hover:opacity-50 cursor-pointer mr-8" />
                            </button>
                            <div className="flex flex-row">
                                <h1 className="text-black dark:text-white text-xl font-RobotoSemiBold mr-4">Hello, {accountData?.first_name} {accountData?.last_name}</h1>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-row'>
                        <div className='flex flex-col'>
                            <h1 className="text-black dark:text-white text-l font-RobotoMedium mr-8">
                                Rides
                            </h1>
                            <p className="text-black dark:text-white text-l font-Roboto mr-8">000</p>
                        </div>
                        <div className='flex flex-col'>
                            <h1 className="text-black dark:text-white text-l font-RobotoMedium">
                                Rating
                            </h1>
                            <p className="text-black dark:text-white text-l font-Roboto mr-8">000</p>
                        </div>
                    </div>
                    <div className=''></div>
                    <h1 className="text-black dark:text-white text-l font-RobotoSemiBold mr-4">Your home address: {accountData?.address}</h1>
                </div>
                <Textarea 
                    onChange={(e) => setBio(e.target.value)}
                    value={bio}
                    className="max-w-lg" 
                    label="Edit your bio:" 
                    errorMessage="The description should not be more than 500 characters long."
                    isInvalid={false}
                    labelPlacement='outside'
                    placeholder="Tell others about yourself..." 
                />
            </div>
            <div className="flex flex-row space-x-2 ml-auto mr-60">
                <Button 
                onPress={() => console.log("Saving bio: ", bio)} // Placeholders for now
                color="primary" 
                className="text-white font-PoppinsRegular mt-6 px-4 py-1" 
                size="sm"
                >
                Save
                </Button>
                <Button
                onPress={() => {
                    setBio("");
                    console.log("Pressed cancel");
                }}
                color="default" 
                className="text-white font-PoppinsRegular mt-6 px-4 py-1" 
                size="sm"
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
};

export default ViewProfile;