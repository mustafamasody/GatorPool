import React from 'react'
import Navbar from './components/navbar'
import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import DocumentMeta from 'react-document-meta';
import Footer from './components/footer';
const Safety = () => {

    const meta = {
        title: 'Safety',
        description: 'Safety',
        canonical: 'https://gatorpool.app/safety',
        meta: {
            charset: 'utf-8',
            name: {
                keywords: 'GatorPool, UF, Rideshare, Rides, Pool, Carpool, Uber, Lyft',
            },
        },
    };

    const navigate = useNavigate();

    interface SafetyFeature {
        name: string;
        description: string;
    }

    const safetyFeatures: SafetyFeature[] = [
        {
            name: "UF Students Only",
            description: `
            We ensure that only UF students can use GatorPool. We do this on signup by asking for a valid UF email,
            and sending a prompt to the user's UF email to verify their account.
            `
        },
        {
            name: "Ride Requests",
            description: `
            Rides from the driver and rider are not confirmed until either or both parties confirm the ride.
            Riders and drivers can also cancel a ride at any time.
            `
        },
        {
            name: "Driver Verification",
            description: `
            All drivers are verified by the GatorPool team. Federal and state law requires us to keep records
            of driver vehicles and license plates. We will NEVER ask for your ID.
            `
        },
    ];

    return (
        <div className="flex flex-col min-h-screen w-full overflow-y-auto bg-white dark:bg-[#0c0c0c]">
            <Navbar />
            <DocumentMeta {...meta} />
            <div className="flex flex-col items-center h-full w-full mt-32 px-6">
                <h1 className="text-4xl text-center text-black dark:text-white font-RobotoBold">
                    Our Mission
                </h1>
                <p className="text-lg mt-3 text-center max-w-screen-lg text-black dark:text-white font-RobotoRegular">
                    GatorPool is committed to providing a safe and secure experience for all users. We have implemented a number of safety features to ensure that your
                    experience with GatorPool is a positive one.
                </p>
            </div>

            <div className="flex flex-col items-center h-full w-full mt-16 px-6">
                <h1 className="text-4xl text-center text-black dark:text-white font-RobotoBold">
                    Safety Features
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 mt-8 w-auto items-center gap-8">
                    {safetyFeatures.map((feature, index) => (
                        <div key={index} className="h-48 flex flex-col items-center gap-2 bg-slate-100 dark:bg-neutral-900 rounded-xl p-4">
                            <h2 className="text-2xl text-center text-black dark:text-white font-RobotoBold">{feature.name}</h2>
                            <p className="text-lg max-w-96 text-center text-black dark:text-white font-RobotoRegular">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-center h-full w-full mt-16 px-6">
                <h1 className="text-4xl text-center text-black dark:text-white font-RobotoBold">
                    Ready to get a ride?
                </h1>
                <Button
                className="mt-2 w-48"
                radius="full"
                color="primary"
                size="lg"
                
                onClick={() => {
                    navigate("/auth/signup");
                }}
                >
                    Get a Ride
                </Button>
            </div>

            <div className="flex flex-col mb-16 items-center h-full w-full mt-16 px-6">
                <h1 className="text-4xl text-center text-black dark:text-white font-RobotoBold">
                    UF Student Code of Conduct
                </h1>
                <Button
                className="mt-2 w-48"
                radius="full"
                color="primary"
                size="lg"
                
                onClick={() => {
                    window.open("https://policy.ufl.edu/wp-content/uploads/2021/12/4-040_2021-12-06.pdf", "_blank");
                }}
                >
                    Read More
                </Button>
            </div>

            <Footer />
        </div>
    )
}

export default Safety