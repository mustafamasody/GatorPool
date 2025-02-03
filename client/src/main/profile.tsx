import React, { useState, useEffect } from 'react'
import { Button, Input, Avatar, AvatarIcon} from '@heroui/react';
import Navbar from './components/navbar';

const ViewProfile = () => {

    return(
        <div className="light dark:dark bg-white dark:bg-black flex flex-col h-full min-h-full min-h-screen w-full">
        <Navbar />
            <div className="flex flex-col justify-center items-center mt-5">
                <Avatar 
                    src="/assets/images/cheshirecat.jpeg"
                    onError={() => console.log('Error loading avatar image')}
                >
                    <AvatarIcon />
                </Avatar>
                
            </div>
        </div>
    );
};

export default ViewProfile;