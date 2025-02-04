import React, { useEffect } from 'react'
import Sidebar from './components/sidebar'
import { useState } from 'react'; 
import { motion, AnimatePresence } from 'framer-motion';
import fetchBase from '../common/fetchBase';
import ViewProfile from './profile/profile';
import useLocalStorage from './utils/useLocalStorage';
import CloseIcon from '@mui/icons-material/Close';
import Dashboard from './dashboard/dashboard';

/**
 *     "status_cards": [
        {
            "title": "Home Address",
            "description": "Add your home address to get started",
            "type": "critical",
            "action": "rider_add_address"
        },
 */

export interface AccountData {
    first_name: string;
    last_name: string;
    email: string;
    profile_picture: string;
    user_uuid: string;
    status_cards: StatusCard[];
}

export interface StatusCard {
    uuid: string;
    title: string;
    description: string;
    type: string;
    action: string;
    action_name: string;
    display_type: string;
}

const ViewController = ({}) => {

    const [accountData, setAccountData] = useState<AccountData>(null);
    const [announcementData, setAnnouncementData] = useState<any>(null);

    useEffect(() => {

        fetch(fetchBase + "/v1/config/banner", {
            method: 'GET', credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
              'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username')
            },
          }).then(res => res.json()).then((data) => {
            setAnnouncementData(data.announcement);
        }) 

        fetch(fetchBase + "/v1/account/loadin", {
            method: 'POST', credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
              'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username')
            },
            body: JSON.stringify({
                hydrate_dashboard: true
            })
          }).then(res => res.json()).then((data) => {
            if(!data.success) {
              if(data.error?.includes("no account") || data.error?.includes("session") || data.error?.includes("token")) {
                window.location.href = "/authv2"; 
              }
            } else {
                let accountData = {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    profile_picture: data.profile_picture,
                    user_uuid: data.user_uuid,
                    status_cards: data.status_cards
                }
                setAccountData(accountData);
            }
          })
    }, []);

    const currentTab = window.location.pathname.split('/')[1];
    const secondaryTab = window.location.pathname.split('/')[2];

    const [sidebarShown, setSidebarShown] = useLocalStorage('sidebarShown', true);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    let title = '';

    const [globalAccount, setGlobalAccount] = useState(null);

    let component = null;
    let navigate = null;

    switch(currentTab) {
        case "profile":
            title = 'Profile';
            component = <ViewProfile accountData={accountData} setAccountData={setAccountData} />;
            break;
        case "dashboard":
            title = 'Dashboard';
            component = <Dashboard accountData={accountData} setAccountData={setAccountData} />;
            break;
        default:
            title = 'Profile';
            component = <ViewProfile accountData={accountData} setAccountData={setAccountData}  />;
            break;
    }

    const sidebarVariants = {
        hidden: { 
            x: '-100%',
            transition: {
                type: 'tween',
                ease: 'linear',
                duration: 0.1 // Adjust this value to control the speed (lower is faster)
            }
        },
        visible: {
            x: 0,
            transition: {
                type: 'tween',
                ease: 'linear',
                duration: 0.1
            }
        }
    };

        return (

            <div  className="relative flex flex-row w-full bg-backgroundDark ">
                        {
                            announcementData && (
                                <div className={`fixed flex z-40 items-center justify-center top-0 left-0 h-10 w-full ${announcementData.type === "general" ? " bg-green-600 text-white " : " bg-amber-500 text-white "}`}>
                                    <h1 className={`my-auto font-PoppinsRegular text-sm text-center
                                    text-white`}>
                                        {announcementData.announcement}
                                    </h1>

                                    <button className="absolute right-0 mr-2 mb-1
                                    hover:opacity-50
                                    " onClick={() => {
                                        fetch(fetchBase + "/v1/config/banner/close", {
                                            method: 'GET', credentials: 'include',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
                                              'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username')
                                            },
                                          }).then(res => res.json()).then((data) => {
                                            if(data.success) {
                                                setAnnouncementData(null);
                                            }
                                        })
                                    }}>
                                        <CloseIcon sx={{ fontSize: 24, color: "white" }} />
                                    </button>
                                </div>
                            )
                        }
                


                <div className={`
                    ${announcementData ? " mt-10 " : " h-full "}
                    flex flex-row w-full `}>
                <AnimatePresence>
                    {sidebarVisible && (
                        <motion.div
                            className={`fixed z-50 top-0 left-0 w-[19.5rem] h-full bg-slate-950 block lg:hidden`}
                            variants={sidebarVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                        >
                            <Sidebar 
                            announcementData={announcementData} 
                            setAnnouncementData={setAnnouncementData}
                            sidebarShown={sidebarShown} setSidebarShown={setSidebarShown} sidebarState={sidebarVisible} setSidebarState={setSidebarVisible} mobile={false} accountData={accountData} />
                        </motion.div>
                    )}
                </AnimatePresence>

                    {
                        !sidebarVisible && (
                            <div className="absolute top-4 left-4 lg:hidden">
                                <button onClick={() => setSidebarVisible(true)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                    </svg>
                                </button>
                            </div>
                        )
                    }
    
                    <div
                    className={`
                        
                    ${sidebarVisible ? ' mobile:hidden lg:block w-64 ' : ' mobile:hidden lg:block w-16 '}
                    absolute fixed z-30 border-r-1 border-neutral-200 top-0 left-0 bg-slate-950`}>
                        <Sidebar
                        announcementData={announcementData}
                        setAnnouncementData={setAnnouncementData}
                        sidebarShown={sidebarShown} setSidebarShown={setSidebarShown} sidebarState={sidebarVisible} setSidebarState={setSidebarVisible} mobile={false} accountData={accountData} />
                    </div>
    
                    <div className={`${sidebarShown ? ' lg:ml-[19.5rem] w-full lg:w-[calc(100vw-19.5rem)] ' : ' lg:ml-20 w-full lg:w-[calc(100vw-5rem)] '}`}>
                        {
                            accountData && component
                        }
                    </div>
                </div>
        </div>
      )
    // }
}

export default ViewController