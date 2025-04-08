import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import fetchBase from '../../common/fetchBase';
import logo from '../../assets/images/logo.png';
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
        <nav className="bg-green-800 fixed z-30 text-white w-full shadow">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo and title */}
              <div className="flex flex-row md:justify-between w-full items-center">
                <div className="flex flex-row space-x-6 items-center">
                  <div className="flex flex-row items-center">
                    <img
                      src={logo}
                      alt="GatorPool"
                      className="w-12 h-12 rounded-full bg-secondary"
                    />
                    <span className="ml-1 text-xl font-semibold">GatorPool</span>
                  </div>
                  {/* Desktop Links */}
                </div>
                <div className="flex flex-row ml-auto md:mb- space-x-0 lg:space-x-4">
                <div className="hidden md:flex space-x-2">
                    <Link to="/" className="block font-RobotoRegular text-lg rounded-full text-white px-4 py-2 ">
                      Home
                    </Link>
                    <Link to="/about" className="block font-RobotoRegular text-lg rounded-full text-white px-4 py-2 ">
                      About
                    </Link>
                    <Link to="/safety" className="block font-RobotoRegular text-lg rounded-full text-white px-4 py-2">
                      Safety
                    </Link>
                  </div>
                  {
                    isLoggedIn ? (
                      <Link to="/dashboard" className="block font-RobotoRegular text-sm md:text-lg rounded-full text-white px-3 py-2 ">
                        Dashboard
                      </Link>
                    ) : (
                      <div className="flex flex-row space-x-2 items-center">
                          <Link to="/auth/signup" className="block font-RobotoRegular text-sm md:text-lg rounded-full text-white px-3 py-2 ">
                            Try Now
                          </Link>
                          <Link to="/auth/signin" className="block font-RobotoRegular text-sm md:text-lg rounded-full text-white px-3 py-2 ">
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
                <Link to="/about" className="block font-RobotoRegular py-2 px-4 text-white hover:bg-primarynewdark">
                  About
                </Link>
                <Link to="/safety" className="block font-RobotoRegular py-2 px-4 text-white hover:bg-primarynewdark">
                  Safety
                </Link>
              </div>
            )}
          </div>
        </nav>
    </>
  );
}

