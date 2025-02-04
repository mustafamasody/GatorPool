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


    interface SidebarProps {
        setSidebarState: React.Dispatch<React.SetStateAction<boolean>>;
        sidebarState: boolean;
        mobile: boolean;
        accountData: any;
        sidebarShown: boolean;
        setSidebarShown: React.Dispatch<React.SetStateAction<boolean>>;
        announcementData: any;
        setAnnouncementData: React.Dispatch<React.SetStateAction<any>>;
    }
  
  const Sidebar: React.FC<SidebarProps> = ({ announcementData, setAnnouncementData, setSidebarState, sidebarState, mobile, accountData, sidebarShown, setSidebarShown }) => {

    const [activeTab, setActiveTab] = useState<string>(window.location.pathname.split('/')[1]);
    const sidebarOpenRef = useRef<HTMLDivElement>(null);

    interface MainTab {
      id: string;
      icon: React.ReactElement;
      title: string;
      tabgroup: React.ReactElement;
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
        className={`relative flex items-center transition delay-25 w-full py-3 px-4 
          ${sidebarShown ? '' : 'lg:items-center lg:justify-center'}
          rounded-full text-gray-300 
          active:scale-[95%] transition-transform duration-200 ease-in-out
          ${
            activeTab === id || activeTab === secondaryId
              ? 'bg-gator-translucent '
              : 'hover:bg-gator-translucent2 darkv1fds:hover:bg-[#1f376cb0]'
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
            <span className={`text-start ml-4 text-md font-RobotoMedium ${activeTab === id ? ' text-emerald-400 ' : ' text-white  '}`}>
            {title}
          </span>
          )
        }

        {
          tooltipHover && tooltipHoverFor === id && (
            <div
            className={`
            ${sidebarShown ? ' hidden ' : ' absolute '}
            ${
            title.length > 20 ? '-right-32' : '-right-24'
            } bg-black  px-4 py-2 rounded shadow max-w-xs whitespace-nowrap`}
            >
            <p className="text-white text-sm truncate">
            {title}
            </p>
        </div>



          )
        }
      </Link>
  );

    const mainTabs: MainTab[] = [
      {
        id: "ride",
        icon: <Bike />,
        title: "Ride",
        tabgroup: <>
            <Tab title="Dashboard" activeIcon={<HomeSharpIcon className={`text-emerald-400 `} sx={{ fontSize: 24 }} />} nonActiveIcon={<HomeOutlinedIcon  sx={{ fontSize: 24 }} />} id="dashboard"  />
            <Tab title="Find a ride" activeIcon={<HomeSharpIcon className={`text-emerald-400 `} sx={{ fontSize: 24 }} />} nonActiveIcon={<HomeOutlinedIcon  sx={{ fontSize: 24 }} />} id="find-ride"  />
            <Tab title="Ride History" activeIcon={<HomeSharpIcon className={`text-emerald-400 `} sx={{ fontSize: 24 }} />} nonActiveIcon={<HomeOutlinedIcon  sx={{ fontSize: 24 }} />} id="ride-history"  />
        </>
      },
      {
        id: "drive",
        icon: <ShipWheel />,
        title: "Drive",
        tabgroup: <>
            <Tab title="Find riders" activeIcon={<HomeSharpIcon className={`text-emerald-400 `} sx={{ fontSize: 24 }} />} nonActiveIcon={<HomeOutlinedIcon  sx={{ fontSize: 24 }} />} id="find-riders"  />
            <Tab title="Drive History" activeIcon={<HomeSharpIcon className={`text-emerald-400 `} sx={{ fontSize: 24 }} />} nonActiveIcon={<HomeOutlinedIcon  sx={{ fontSize: 24 }} />} id="drive-history"  />
            <Tab title="Ratings" activeIcon={<HomeSharpIcon className={`text-emerald-400 `} sx={{ fontSize: 24 }} />} nonActiveIcon={<HomeOutlinedIcon  sx={{ fontSize: 24 }} />} id="ratings"  />
        </>
      },
      {
        id: "settings",
        icon: <Settings />,
        title: "Settings",
        tabgroup: <>
            <Tab title="Profile" activeIcon={<Person2Icon className={`text-emerald-400 `} sx={{ fontSize: 24 }} />} nonActiveIcon={<Person2Icon  sx={{ fontSize: 24 }} />} id="profile"  />
        </>
      },
    ]

    const [activeMainTab, setActiveMainTab] = useState<string>("ride");
  
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
        bg-black
        border-r-1 dark:border-neutral-800 border-neutral-300
        ${sidebarShown ? ' w-[19.5rem] ' : ' lg:max-w-20 '}
        
    `}
    ref={sidebarOpenRef}
    >

<div className={`
        ${sidebarShown ? "flex" : "hidden "}
         flex-col w-20 h-full px-2 py-2 border-r-1 items-center border-neutral-800`}>
          
                  <img
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  src={

          require('../../assets/images/logo.png')

          } className={`w-12 h-12 items-center
          rounded-md
          dark:rounded-xs`} alt="GatorPool" />
          {
            mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveMainTab(tab.id);
                }}
                className={`
                ${activeMainTab === tab.id ? ' bg-neutral-900 text-white ' : ' hover:bg-foregroundDark '}
                p-3 rounded-full mt-2
                `}>
                  {tab.icon}
              </button>
            ))
          }

      </div>

      <div className="flex flex-col w-full h-full">

      <button
              onClick={() => {
                setSidebarShown(!sidebarShown);

                // set the current main tab to whichever one the activeTab is in
                const mainTab = mainTabs.find(tab => tab.id === activeTab);
                if(mainTab) {
                  setActiveMainTab(mainTab.id);
                }
              }}
              className={`
              hidden lg:flex items-center justify-center absolute top-4 -right-4 w-8 h-8 rounded-full lightv1:bg-slate-100 lightv1:hover:bg-slate-200 newdark:bg-primarynewdark newdark:hover:bg-secondarynewdark border border-1 border-neutral-700
              `}>
                {
                  sidebarShown ? (
                    <ChevronLeftIcon sx={{ fontSize: 28 }} className="text-white " />
                  ) : (
                    <ChevronRightIcon sx={{ fontSize: 28 }} className="text-white " />
                  )
                }
              </button>

              <button
                onClick={(e) => {
                    setSidebarState(false);
                    e.preventDefault();
                    e.stopPropagation();
                }}
                className="absolute  lg:hidden left-[16.5rem] top-[1rem] text-white  rounded-full p-1 lightv1:hover:bg-slate-400 newdark:hover:bg-hoverlighternewdark darkv1:hover:bg-hover">
                <div className="flex justify-center items-center">
                    <CloseIcon style={{ color: "white" }} sx={{ fontSize: 24 }} />
                </div>    
              </button>

              {
                sidebarShown ? (
                  <h1 className="text-2xl ml-6 font-RobotoSemiBold text-white  mt-4 text-left">
                  {mainTabs.find(tab => tab.id === activeMainTab)?.title}
                </h1>
                ) : (
                  <img src={

                    require('../../assets/images/logo.png')
          
                    } className={`w-12 h-12 mx-auto mt-2 items-center
                    rounded-md
                    dark:rounded-xs`} alt="GatorPool" />
                )
              }

              <div className="flex flex-col mt-3 min-w-[100%] w-full h-full">

                  {
                    mainTabs.map((tab) => (
                      activeMainTab === tab.id && (
                        <div className="flex flex-col space-y-1 items-center w-full px-4">
                            {tab.tabgroup}
                        </div>
                      )
                    ))
                  }

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
                            <LogoutIcon sx={{ fontSize: 24 }} className={`text-emerald-400 `} />
                        </div>

                        {
                          sidebarShown && (
                            <span className={` mt-1 ml-4  text-md font-RobotoRegular ${activeTab === 'account' ? ' text-white  ' : ' text-white '}
                            
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