import React, { useState, useEffect } from 'react'
import {Textarea, Button, Input} from '@heroui/react';
import { AccountData } from '../view_controller';

interface ViewProfileProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const ViewProfile: React.FC<ViewProfileProps> = ({ accountData, setAccountData }) => {

    const [bio, setBio] = useState<string>("");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file=event.target.files?.[0]
        if (file){
            console.log("Selected file: ", file);
        }
    };

    const handleClick = () => {
        const fileInput = document.getElementById("fileInput") as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    };


    return(
        <div className="flex bg-white dark:bg-black p-8 items-center w-full">
            <div className="flex flex-col w-full ml-16">
                <h1 className="text-black dark:text-white text-l font-RobotoExtraBold text-2xl mt-20 mb-6">
                    Profile Details
                </h1>
                <div className="flex flex-row items-center mb-6">
                    <button onClick={()=> console.log("Profile picture clicked!")}>
                        <img src={accountData.profile_picture}
                        className="h-40 w-40 rounded-full hover:opacity-50 cursor-pointer mr-6" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-black dark:text-white text-2xl font-RobotoSemiBold mr-4">{accountData?.first_name} {accountData?.last_name}</h1>
                        <h2 className="text-black dark:text-white text-md font-RobotoSemiBold mr-4">Rating: 5.0</h2>
                    </div>
                </div>

                <div className="flex flex-row w-full mb-6">
                    <Textarea 
                        isReadOnly
                        className="max-w-xs text-black dark:text-white font-Roboto mr-6 w-full" 
                        defaultValue= {`${accountData?.first_name} ${accountData?.last_name}`}
                        label="Name"
                        labelPlacement="outside"
                        variant="bordered"
                        maxRows={1}
                    />
                    <Textarea 
                        isReadOnly
                        className="max-w-xs text-black dark:text-white font-Roboto w-full" 
                        defaultValue= {accountData.email}
                        label="UFL Email"
                        labelPlacement="outside"
                        variant="bordered"
                        maxRows={1}
                    />
                </div>
                <div className="flex flex-row">
                    <Input
                        className="max-w-xs text-black dark:text-white font-Roboto mr-6 w-full mb-6" 
                        placeholder = {accountData?.first_name}
                        label="Preferred Name"
                        labelPlacement="outside"
                        variant="bordered"
                    />
                </div>
                <Textarea 
                    onChange={(e) => setBio(e.target.value)}
                    value={bio}
                    className="max-w-lg w-full" 
                    label="Edit your bio:"
                    errorMessage="The description should not be more than 500 characters long."
                    isInvalid={false}
                    labelPlacement='outside'
                    placeholder="Tell others about yourself..." 
                />
            </div>
        </div>
    );
};

export default ViewProfile;