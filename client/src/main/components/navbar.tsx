import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import fetchBase from '../../common/fetchBase';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {

    fetch(fetchBase + "/v1/auth/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-GatorPool-Device-Id": localStorage.getItem("X-GatorPool-Device-Id"),
            "X-GatorPool-Username": localStorage.getItem("X-GatorPool-Username"),
        },
        credentials: "include",
        body: JSON.stringify({})
    }).then(res => res.json()).then(data => {
        if(!data.success) {
            setIsLoggedIn(false);
        } else {
            setIsLoggedIn(true);
        }
    }).catch(error => {
        setIsLoggedIn(false);
    })

}, []);

  return (
    <>
        <nav className="bg-secondary fixed z-30 text-white w-full shadow">
          <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and title */}
              <div className="flex flex-row md:justify-between w-full items-center">
                <div className="flex flex-row space-x-6 items-center">
                  <div className="flex flex-row items-center">
                    <img
                      src={require("../../assets/images/logo.png")}
                      alt="GatorPool"
                      className="w-12 h-12 rounded-full bg-secondary"
                    />
                    <span className="ml-1 text-xl font-semibold">GatorPool</span>
                  </div>
                  {/* Desktop Links */}
                  <div className="hidden md:flex space-x-2">
                    <Link to="/" className="block font-RobotoRegular text-sm rounded-full text-white px-3 py-2 transition delay-75 hover:bg-primary">
                      Home
                    </Link>
                    <Link to="/" className="block font-RobotoRegular text-sm rounded-full text-white px-3 py-2 transition delay-75 hover:bg-primary">
                      Link 1
                    </Link>
                    <Link to="/" className="block font-RobotoRegular text-sm rounded-full text-white px-3 py-2 transition delay-75 hover:bg-primary">
                      Link 2
                    </Link>
                    <Link to="/" className="block font-RobotoRegular text-sm rounded-full text-white px-3 py-2 transition delay-75 hover:bg-primary">
                      Link 3
                    </Link>
                    <Link to="/" className="block font-RobotoRegular text-sm rounded-full text-white px-3 py-2 transition delay-75 hover:bg-primary">
                      Link 4
                    </Link>
                  </div>
                </div>
                <div className="flex flex-row ml-auto md:mb- space-x-0 lg:space-x-4">
                  {
                    isLoggedIn ? (
                      <Link to="/dashboard" className="block font-RobotoRegular text-sm rounded-full text-white px-3 py-2 transition delay-75 hover:bg-primary">
                        Dashboard
                      </Link>
                    ) : (
                      <div className="flex flex-row space-x-2 items-center">
                          <Link to="/auth/signup" className="block font-RobotoRegular text-sm rounded-full text-white px-3 py-2 transition delay-75 hover:bg-primary">
                            Try Now
                          </Link>
                          <Link to="/auth/signin" className="block font-RobotoRegular text-sm rounded-full text-white px-3 py-2 transition delay-75 hover:bg-primary">
                            Login
                          </Link>
                      </div>
                    )
                  }
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-gray-300 mt-2 md:mt-0 hover:text-white focus:outline-none focus:text-white"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {isOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
              <div className="md:hidden flex flex-col space-y-2 mt-2">
                <Link to="/" className="block py-2 px-4 text-white">
                  Home
                </Link>
                <Link to="/" className="block font-RobotoRegular py-2 px-4 text-white hover:bg-primarynewdark">
                  Link 1
                </Link>
                <Link to="/" className="block font-RobotoRegular py-2 px-4 text-white hover:bg-primarynewdark">
                  Link 2
                </Link>
                <Link to="/" className="block font-RobotoRegular py-2 px-4 text-white hover:bg-primarynewdark">
                  Link 3
                </Link>
                {
                  isLoggedIn ? (
                    <Link to="/dashboard" className="block font-RobotoRegular py-2 px-4 text-white hover:bg-primarynewdark">
                      Dashboard
                    </Link>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Link to="/auth/signup" className="block font-RobotoRegular py-2 px-4 text-white hover:bg-primarynewdark">
                        Try Now
                      </Link>
                      <Link to="/auth" className="block font-RobotoRegular py-2 px-4 text-white hover:bg-primarynewdark">
                        Login
                      </Link>
                    </div>
                  )
                }
              </div>
            )}
          </div>
        </nav>
    </>
  );
}

