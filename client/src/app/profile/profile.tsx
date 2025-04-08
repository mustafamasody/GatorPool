import React, { useState, useRef } from 'react'
import {Textarea, Button, Input} from '@heroui/react';
import { AccountData } from '../view_controller';
import PencilIcon from '../components/pencilicon';
import Modal from "./modal"

interface ViewProfileProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const ViewProfile: React.FC<ViewProfileProps> = ({ accountData, setAccountData }) => {

    const [bio, setBio] = useState<string>("");
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    
    const updateAvatar = (imgSrc) => {
        setAccountData({
            ...accountData,
            profile_picture: imgSrc,
        });
    };

    return(
        <div className="flex bg-white dark:bg-[#0c0c0c] min-h-screen p-8 items- w-full">
            <div className="flex flex-col w-full ml-16">
                <h1 className="text-black dark:text-white text-l font-RobotoExtraBold text-2xl mt-20 mb-6">
                    Profile Details
                </h1>
                <div className="flex flex-row items-center mb-6">
                    <div className="flex flex-col items-center">
                        <img
                        src={accountData.profile_picture}
                        className="w-[150px] h-[150px] rounded-full border-2 border-gray-400 mb-1"
                        />
                        <button
                        className="relative left-0 right-0 m-auto px-4 py-1 rounded-2xl
                        bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white dark:text-black"
                        title="Change photo"  
                        onClick = {()=>setModalOpen(true)}            
                        >
                        <PencilIcon/>
                        </button>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-black dark:text-white text-2xl font-RobotoSemiBold mr-4 ml-4">{accountData?.first_name} {accountData?.last_name}</h1>
                        {/*<h2 className="text-black dark:text-white text-md font-RobotoSemiBold mr-4">Rating: 5.0</h2>*/}
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
            {modalOpen && (
                <Modal
                    updateAvatar={updateAvatar}
                    closeModal={()=>setModalOpen(false)}
                    accountData={accountData}
                    setAccountData={setAccountData}
                />
            )}
        </div>
    );
};

export default ViewProfile;