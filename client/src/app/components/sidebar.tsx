import React, { useEffect, useRef } from 'react'
import HomeSharpIcon from '@mui/icons-material/HomeSharp';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import fetchBase from '../../common/fetchBase';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Notebook, Bot, Bike, ShipWheel, Settings } from 'lucide-react';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import { AlarmSmoke } from 'lucide-react';
import Person2Icon from '@mui/icons-material/Person2';
import { AccountData } from '../view_controller';
import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import logo from '../../assets/images/logo.png';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import WorkHistoryOutlinedIcon from '@mui/icons-material/WorkHistoryOutlined';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import HailOutlinedIcon from '@mui/icons-material/HailOutlined';
import HailIcon from '@mui/icons-material/Hail';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AirlinesIcon from '@mui/icons-material/Airlines';
import AirlinesOutlinedIcon from '@mui/icons-material/AirlinesOutlined';

    interface SidebarProps {
        setSidebarState: React.Dispatch<React.SetStateAction<boolean>>;
        sidebarState: boolean;
        mobile: boolean;
        accountData: AccountData;
        sidebarShown: boolean;
        setSidebarShown: React.Dispatch<React.SetStateAction<boolean>>;
        announcementData: any;
        setAnnouncementData: React.Dispatch<React.SetStateAction<any>>;
    }
  
  const Sidebar: React.FC<SidebarProps> = ({ announcementData, setAnnouncementData, setSidebarState, sidebarState, mobile, accountData, sidebarShown, setSidebarShown }) => {

    const [activeTab, setActiveTab] = useState<string>(window.location.pathname.split('/')[1]);
    const sidebarOpenRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    interface MainTab {
      id: string;
      icon: React.ReactElement;
      title: string;
      tabgroup: React.ReactElement;
      mapArray: string[];
    }

    const Tab: React.FC<{
      title: string;
      activeIcon: React.ReactElement;
      nonActiveIcon: React.ReactElement;
      id: string;
      secondaryId?: string;
    }> = ({ title, activeIcon, nonActiveIcon, id, secondaryId }) => (
      <Link
        to={`/${id}`}
        onMouseEnter={() => {
          setTooltipHover(true);
          setTooltipHoverFor(id);
        }}
        onMouseLeave={() => {
          setTooltipHover(false);
          setTooltipHoverFor('');
        }}
        className={`relative flex items-center w-full py-3 px-4
          ${sidebarShown ? '' : 'lg:items-center lg:justify-center'}
          rounded-xl text-gray-800 dark:text-gray-300 
          
          ${
            activeTab === id || activeTab === secondaryId
              ? 'bg-slate-200 dark:bg-[#1a1a1a] '
              : 'hover:bg-slate-200 dark:hover:bg-[#1a1a1a] darkv1fds:hover:bg-[#1f376cb0]'
          }
        `}
        
        onClick={(e) => {
          handleTabClick(id)
        }}
      >
        {  
            activeTab === id ? React.cloneElement(activeIcon as React.ReactElement<any>, {
              sx: { fontSize: 24 },
            }) : React.cloneElement(nonActiveIcon as React.ReactElement<any>, {
              sx: { fontSize: 24 },
            })
          
        }
        {
          sidebarShown && (
            <span className={`text-start ml-4 text-md font-RobotoMedium text-gray-800 dark:text-gray-300`}>
            {title}
          </span>
          )
        }
      </Link>
  );

    const mainTabs: MainTab[] = [
      {
        id: "ride",
        icon: <Bike className="text-gray-800 dark:text-gray-300" />,
        title: "Ride",
        tabgroup: <>
            <Tab title="Dashboard" activeIcon={<HomeSharpIcon className={`text-gray-800 dark:text-gray-300  `} sx={{ fontSize: 24 }} />} nonActiveIcon={<HomeOutlinedIcon  sx={{ fontSize: 24 }} />} id="dashboard"  />
            <Tab title="My Rides" activeIcon={<AirlinesIcon className={`text-gray-800 dark:text-gray-300  `} sx={{ fontSize: 24 }} />} nonActiveIcon={<AirlinesOutlinedIcon  sx={{ fontSize: 24 }} />} id="rider-flow/trips"  />
            <Tab title="Find a ride" activeIcon={<TravelExploreIcon className={`text-gray-800 dark:text-gray-300  `} sx={{ fontSize: 24 }} />} nonActiveIcon={<TravelExploreOutlinedIcon  sx={{ fontSize: 24 }} />} id="find-ride"  />
            {/* <Tab title="Ride History" activeIcon={<WorkHistoryIcon className={`text-gray-800 dark:text-gray-300  `} sx={{ fontSize: 24 }} />} nonActiveIcon={<WorkHistoryOutlinedIcon  sx={{ fontSize: 24 }} />} id="ride-history"  /> */}
        </>,
        mapArray: ["dashboard", "find-ride", "ride-history"]
      },
      {
        id: "drive",
        icon: <ShipWheel className="text-gray-800 dark:text-gray-300" />,
        title: "Drive",
        tabgroup: <>
        {
          accountData?.driver_verified && (
            <>
              <Tab title="Create Ride" activeIcon={<AddCircleOutlineIcon className={`text-gray-800 dark:text-gray-300  `} sx={{ fontSize: 24 }} />} nonActiveIcon={<AddCircleOutlineOutlinedIcon  sx={{ fontSize: 24 }} />} id="create-trip"  />
              <Tab title="My Trips" activeIcon={<DirectionsCarFilledIcon className={`text-gray-800 dark:text-gray-300  `} sx={{ fontSize: 24 }} />} nonActiveIcon={<DirectionsCarFilledOutlinedIcon  sx={{ fontSize: 24 }} />} id="my-trips"  />
              <Tab title="Find riders" activeIcon={<HailIcon className={`text-gray-800 dark:text-gray-300  `} sx={{ fontSize: 24 }} />} nonActiveIcon={<HailOutlinedIcon  sx={{ fontSize: 24 }} />} id="find-riders"  />
              <Tab title="Ratings" activeIcon={<StarBorderIcon className={`text-gray-800 dark:text-gray-300  `} sx={{ fontSize: 24 }} />} nonActiveIcon={<StarBorderOutlinedIcon  sx={{ fontSize: 24 }} />} id="ratings"  />
            </>
          )
        }
        {
          accountData.driver_applications && accountData?.driver_applications.length > 0 && !accountData.driver_verified && (
            <>
              {
                accountData.driver_applications.map((application, index) => (
                  <Tab
                  key={application.application_uuid}
                  title={"Application " + (index + 1)} activeIcon={<HomeSharpIcon className={`text-gray-800 dark:text-gray-300  `} sx={{ fontSize: 24 }} />} nonActiveIcon={<HomeOutlinedIcon  sx={{ fontSize: 24 }} />} id={`driver-application?uuid=${application.application_uuid}`}
                   secondaryId={application.application_uuid} />
                ))
              }
            </>
          )
        }
        {
          !accountData.driver_applications && !accountData.driver_verified && (
            <>
              <Tab title="Apply" activeIcon={<HomeSharpIcon className={`text-gray-800 dark:text-gray-300  `} sx={{ fontSize: 24 }} />} nonActiveIcon={<HomeOutlinedIcon  sx={{ fontSize: 24 }} />} id="driver-apply"  />
            </>
          )
        }
        </>,
        mapArray: ["my-trips", "find-riders", "ratings"]
      },
      {
        id: "settings",
        icon: <Settings className="text-gray-800 dark:text-gray-300" />,
        title: "Settings",
        tabgroup: <>
            <Tab title="Profile" activeIcon={<Person2Icon className={`text-gray-800 dark:text-gray-300  `} sx={{ fontSize: 24 }} />} nonActiveIcon={<Person2Icon  sx={{ fontSize: 24 }} />} id="profile"  />
        </>,
        mapArray: ["profile"]
      },
    ]

    const [activeMainTab, setActiveMainTab] = useState<string>("ride");
  
    useEffect(() => {

      // set the current active tab to whichever one the window.location.pathname is in (without the /)
      const activeTab = mainTabs.find(tab => tab.mapArray.includes(window.location.pathname.split('/')[1].replace("/", "")));
      if(activeTab) {
        setActiveMainTab(activeTab.id);
      }

    }, [window.location.pathname])

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (sidebarOpenRef.current && !sidebarOpenRef.current.contains(event.target as Node) && mobile) {
          setSidebarState(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpenRef, mobile, setSidebarState]);
  
    const handleTabClick = (id: string) => {
      setActiveTab(id);
      if (mobile) {
        setSidebarState(false);
      }
    };

    const [tooltipHover, setTooltipHover] = useState<boolean>(false);
    const [tooltipHoverFor, setTooltipHoverFor] = useState<string>('');

  return (

<div>
    <div
    className={`relative flex mobile:fixed lg:fixed flex-row items-center text-gray-300 
      ${announcementData ? " mt-10 h-[calc(100vh-2rem)] " : " h-full "}
        z-20
        bg-white dark:bg-[#0c0c0c]
        border-r-1 dark:border-neutral-800 border-neutral-300
        w-[16.5rem] 
        
    `}
    ref={sidebarOpenRef}
    >

      

      <div className="flex flex-col w-full h-full">

        <div className="flex flex-col w-full h-auto px-4 pt-4">

              <button
                onClick={(e) => {
                    setSidebarState(false);
                    e.preventDefault();
                    e.stopPropagation();
                }}
                className="absolute  lg:hidden left-[13.5rem] top-[1.35rem] text-white  rounded-full p-1 lightv1:hover:bg-slate-400 newdark:hover:bg-hoverlighternewdark darkv1:hover:bg-hover">
                <div className="flex justify-center items-center">
                    <CloseIcon className="text-black dark:text-white" sx={{ fontSize: 24 }} />
                </div>    
              </button>

              <div className="flex flex-row items-center  space-x-2">
                <img src={logo} className={`w-12 h-12 items-center
                    rounded-md
                    dark:rounded-xs`} alt="GatorPool" />
                <h1 className="text-md font-RobotoSemiBold text-black dark:text-white">
                  GatorPool
                </h1>
              </div>
            </div>

              <div className="flex flex-col px-0 py-4 min-w-[100%] w-full h-full">

                <div className="flex flex-col w-full h-full space-y-4">

                {
                  mainTabs.map((tab) => (
                    <div key={tab.id} className="flex flex-col space-y-1 items-center w-full px-4">
                      <div className="flex w-full justify-start flex-row items-center">
                        {tab.icon}
                        <h1 className="ml-2 w-min text-md text-left font-RobotoSemiBold text-black dark:text-white">
                          {tab.title}
                        </h1>
                        <div className="flex ml-2 w-full bg-gray-800 dark:bg-gray-300 rounded-full h-[2px]"> </div>
                      </div>

                      {
                        tab.tabgroup
                      }
                    </div>
                  ))
                }

                </div>

                  <div
                  className={`
                  flex  justify-center items-center laptop:border-none mt-auto md:mb-24 lg:mb-4 bg-transparent px-2`}>
                      <button className={`
                      ${sidebarShown ? ' pl-6 ' : ' justify-center '}
                      flex items-center mb h-12 rounded-xl lg:mt-auto w-full   
                      ${activeTab === 'account' ? ' bg-transparent text-white  ' : ' hover:bg-neutral-200 dark:hover:bg-neutral-700'}
                      `}
                      onClick={() => {
                        fetch(fetchBase + '/oauth2/token', {
                          method: 'POST', credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json',
                            'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                            'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || '',
                          },
                          body: JSON.stringify({
                            grant_type: "revoke",
                            scope: "internal",
                            username: localStorage.getItem('X-GatorPool-Username') || '',
                          })
                        }).then(res => res.json()).then(data => {
                          if(data.success) {
                            // localStorage.removeItem('X-GatorPool-Device-Id');
                            localStorage.removeItem('X-GatorPool-Username');
                            window.location.href = '/auth/signin';
                          }
                        });
                      }}
                      >
                        <div className="  ">
                            <LogoutIcon sx={{ fontSize: 24 }} className={`text-gray-800 dark:text-gray-300  `} />
                        </div>

                        {
                          sidebarShown && (
                            <span className={` mt-1 ml-4 text-black dark:text-white  text-md font-RobotoRegular 
                            
                            `}>Sign Out</span>
                          )
                        }

                    </button>
                </div>
            </div>
          </div>
        </div>
    </div>


  )
}

export default Sidebar