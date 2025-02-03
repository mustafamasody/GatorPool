import React, { useEffect } from 'react'
import Sidebar from './components/sidebar'
import { useState } from 'react'; 
import { motion, AnimatePresence } from 'framer-motion';
import fetchBase from '../common/fetchBase';
import ViewProfile from './profile/profile';

const ViewController = ({}) => {

    const [accountData, setAccountData] = useState(null);
    const [announcementData, setAnnouncementData] = useState<any>(null);

    useEffect(() => {

        fetch(fetchBase + "/prod/config/v1/banner", {
            method: 'GET', credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
              'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username')
            },
          }).then(res => res.json()).then((data) => {
            setAnnouncementData(data.announcement);
        }) 

        fetch(fetchBase + "/prod/account/v1/mc_loadin", {
            method: 'POST', credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
              'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username')
            },
          }).then(res => res.json()).then((data) => {
            if(!data.success) {
              if(data.error?.includes("no account") || data.error?.includes("session") || data.error?.includes("token")) {
                window.location.href = "/authv2"; 
              }
            } else {

                if(data.onboarding_status.state === "onboarding") {
                    // window.location.href = "/onboarding";
                } else {
                    let accountData = {
                        first_name: data.first_name,
                        last_name: data.last_name,
                        email: data.email,
                        ttid: data.ttid,
                        profile_picture: data.profile_picture,
                        user_uuid: data.user_uuid,
                        influencer: data.influencer,
                        apps: data.apps,
                    }
                    setAccountData(accountData);
                }
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
            component = <ViewProfile />;
        default:
            title = 'Profile';
            component = <ViewProfile  />;
    }

        return (

            <div  className="relative flex flex-row w-full bg-backgroundDark ">
                        {
                            announcementData && (
                                <div className={`fixed flex z-40 items-center justify-center top-0 left-0 h-10 w-full ${announcementData.type === "general" ? " bg-accentPrimary text-white " : " bg-amber-500 text-white "}`}>
                                    <h1 className={`my-auto font-PoppinsRegular text-sm text-center
                                    text-white`}>
                                        {announcementData.announcement}
                                    </h1>

                                    <button className="absolute right-0 mr-2 mb-1
                                    hover:opacity-50
                                    " onClick={() => {
                                        fetch(fetchBase + "/prod/config/v1/banner/close", {
                                            method: 'GET', credentials: 'include',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'tt-token': localStorage.getItem('tt-token'),
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
    
                    <div
                    className={`
                        
                    ${sidebarVisible ? ' mobile:hidden lg:block w-64 ' : ' mobile:hidden lg:block w-16 '}
                    absolute fixed z-30 border-r-1 border-neutral-200 top-0 left-0 bg-slate-950`}>
                        <Sidebar
                        announcementData={announcementData}
                        setAnnouncementData={setAnnouncementData}
                        sidebarShown={sidebarShown} setSidebarShown={setSidebarShown} sidebarState={sidebarVisible} setSidebarState={setSidebarVisible} mobile={false} accountData={accountData} />
                        {/* <h1 className="font-PoppinsBold text-white text-2xl text-center">Terra</h1> */}
                    </div>
    
                    <div className="">
                        {component}
                    </div>
                </div>
        </div>
      )
    // }
}

export default ViewController