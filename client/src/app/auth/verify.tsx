import React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import {Button, CircularProgress} from "@heroui/react";
import fetchBase from '../../common/fetchBase';

const Verify: React.FC = () => {

    let id: string = '';
    let signature: string = '';

    // the url is /verify?id=123&signature=456

    // get the id and signature from the url
    let urlParams = new URLSearchParams(window.location.search);
    // list of all the parameters
    let idParam = urlParams.get('id');
    let signatureParam = urlParams.get('signature');

    // set the id and signature
    id = idParam;
    signature = signatureParam;

    const [status, setStatus] = useState<string>(null);
    const [loaded, setLoaded] = useState<boolean>(false);

    useEffect(() => {
        fetch(fetchBase + '/v1/account/auth/verify?id=' + id + '&signature=' + signature,
        {
            method: 'PUT', credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
            },
        }).then(async response => {
            setLoaded(true);
            if (response.status === 200) {
                setStatus('verified');
            } else {
                setStatus('unverified');
            }
        });
    }, [loaded]);

    return (
        <div className="flex flex-col bg-white dark:bg-black w-full h-screen justify-center items-center">
            {
                status ? (
                    <div className="flex flex-col items-center">
                        {
                            status === "verified" ? (
                                <div className="flex flex-col items-center rounded-xl p-9">
                                                      <img src={require("../../assets/images/logo.png")} alt="logo" className="w-24 h-24" />

                                    <h1 className="font-RobotoBold text-xl mt-4 text-green-500">
                                        Verification successful
                                    </h1>
                                    <p className="font-RobotoRegular text-center text-black dark:text-white mt-4">
                                        Your account has been verified. You can now login.
                                    </p>
                                    <Button 
                                        color="primary" className="dark text-black dark:text-white mx-auto font-RobotoRegular w-full mt-6 py-2" size="lg"
                                        onPress={() => {
                                            window.location.href = '/auth/signin';
                                        }}
                                    >
                                        Login
                                    </Button> 
                                </div>
                            ) : (
                                <div className="flex flex-col items-center rounded-xl p-9">
                                                                                          <img src={require("../../assets/images/logo.png")} alt="logo" className="w-24 h-24" />

                                    <h1 className="font-RobotoBold text-xl mt4 text-red-500">
                                        Verification failed
                                    </h1>
                                    <Button 
                                        color="default" className="dark text-black dark:text-white mx-auto font-RobotoRegular w-full mt-6 py-2" size="lg"  variant="bordered"
                                        onPress={() => {
                                            window.location.href = '/auth/signin';
                                        }}
                                    >
                                        Back to Login
                                    </Button>
                                </div>
                            )
                        }
                    </div>
                ) : (
                    <div className="flex flex-col items-center rounded-xl p-9">
                        <CircularProgress aria-label="Loading..." size="lg" />
                        <h1 className="font-RobotoBold text-xl mt-4 text-black dark:text-white">
                            Verifying your account...
                        </h1>
                    </div>
                )
            }
        </div>
    )
}

export default Verify