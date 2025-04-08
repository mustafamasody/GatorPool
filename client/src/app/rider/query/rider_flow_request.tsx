import React, { useEffect, useState, useCallback } from 'react';
import { AccountData } from '../../view_controller';
import { useLocation, useNavigate } from 'react-router-dom';
import {now, parseAbsoluteToLocal, today} from "@internationalized/date";
import { WaypointEntity } from '../../../common/types/waypoint';
import { Button, Checkbox, DatePicker, Input } from '@heroui/react';
import {parseDate, getLocalTimeZone} from "@internationalized/date";
import { debounce } from '../../utils/debounce';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import fetchBase from '../../../common/fetchBase';
import { addToast } from '@heroui/react';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibXVzdGFmYW1hc29keSIsImEiOiJjbTZva3FneTIwZjI5MmxvdWQ1dHY1NTlwIn0.oNPGEBsenNviLdx_qzcPWw';

// Fetch Route from Mapbox Directions API
const fetchRoute = async (from: { lat: number, lng: number }, to: { lat: number, lng: number }, departureTime: Date) => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const duration = data.routes[0]?.duration; // Duration in seconds
        
        if (duration) {
            // Calculate expected arrival time by adding duration to departure time
            const expectedArrivalTime = new Date(departureTime.getTime() + duration * 1000);
            return expectedArrivalTime;
        }
    } catch (error) {
        console.error("Error fetching route:", error);
    }
    return null;
};

// Debounced search function outside component
const debouncedSearchAddress = debounce(async (query: string, type: string, setResults: (results: any[]) => void) => {
    if (query.length < 3) {
        setResults([]);
        return;
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=5`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        setResults(data.features || []);
    } catch (error) {
        console.error("Error fetching geocode data:", error);
        setResults([]);
    }
}, 500);

interface RiderFlowRequestProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
    isFemale: boolean;
}

interface RiderFlowBody {
    body: {
        from: {
            text: string;
            lat: number;
            lng: number;
        };
        to: {
            text: string;
            lat: number;
            lng: number;
        };
        datetime: string;
        flexible_dates: boolean;
        females_only: boolean;
    }
}

const RiderFlowRequest = ({ accountData, setAccountData, isFemale }: RiderFlowRequestProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const navigate = useNavigate();

    // Get the first parameter which contains the JSON data
    const firstParam = searchParams.keys().next().value;
    const riderFlowBody = firstParam ? JSON.parse(decodeURIComponent(firstParam)) as RiderFlowBody : null;

    const [from, setFrom] = useState<{ lat: number, lng: number }>({
        lat: riderFlowBody?.body?.from?.lat,
        lng: riderFlowBody?.body?.from?.lng
    });
    const [to, setTo] = useState<{ lat: number, lng: number } | null>({
        lat: riderFlowBody?.body?.to?.lat,
        lng: riderFlowBody?.body?.to?.lng
    });
    const [fromText, setFromText] = useState(riderFlowBody?.body?.from?.text);
    const [toText, setToText] = useState(riderFlowBody?.body?.to?.text);

    const [fromWaypoint, setFromWaypoint] = useState<WaypointEntity>({
        geo_text: riderFlowBody?.body?.from?.text,
        latitude: riderFlowBody?.body?.from?.lat,
        longitude: riderFlowBody?.body?.from?.lng,
    });
    const [toWaypoint, setToWaypoint] = useState<WaypointEntity>({
        geo_text: riderFlowBody?.body?.to?.text,
        latitude: riderFlowBody?.body?.to?.lat,
        longitude: riderFlowBody?.body?.to?.lng,
    });

    // Separate state for coordinates to prevent infinite updates
    const [fromCoords, setFromCoords] = useState<{ lat: number, lng: number } | null>(
        riderFlowBody?.body?.from ? {
            lat: riderFlowBody.body.from.lat,
            lng: riderFlowBody.body.from.lng
        } : null
    );
    const [toCoords, setToCoords] = useState<{ lat: number, lng: number } | null>(
        riderFlowBody?.body?.to ? {
            lat: riderFlowBody.body.to.lat,
            lng: riderFlowBody.body.to.lng
        } : null
    );

    const [willingToPayForGas, setWillingToPayForGas] = useState<boolean>(false);
    const [willingToPayForFood, setWillingToPayForFood] = useState<boolean>(false);

    const [fromSearchResults, setFromSearchResults] = useState<any[]>([]);
    const [toSearchResults, setToSearchResults] = useState<any[]>([]);

    const [tripDate, setTripDate] = useState<Date>(new Date(riderFlowBody?.body?.datetime));

    const [filtersDropdownOpen, setFiltersDropdownOpen] = useState<boolean>(false);
    const [flexibleDatesOption, setFlexibleDatesOption] = useState<boolean>(false);
    const [femaleDriversOnlyOption, setFemaleDriversOnlyOption] = useState<boolean>(riderFlowBody?.body?.females_only);
    let [date, setDate] = React.useState(parseAbsoluteToLocal(new Date(riderFlowBody?.body?.datetime).toISOString()));

    const [termsAccepted, setTermsAccepted] = useState<{
        guaranteed_ride: boolean;
        feed: boolean;
    }>({
        guaranteed_ride: false,
        feed: false,
    });

    const [expectedArrivalTime, setExpectedArrivalTime] = useState<string | null>(null);

    // Create a memoized debounced function using useCallback
    const updateExpectedArrival = useCallback(
        debounce(async (
            fromCoords: { lat: number, lng: number },
            toCoords: { lat: number, lng: number },
            departureTime: Date,
            setToWaypoint: React.Dispatch<React.SetStateAction<WaypointEntity>>
        ) => {
            console.log("Updating expected arrival with:", { fromCoords, toCoords, departureTime });
            if (!fromCoords || !toCoords) {
                console.log("Missing coordinates");
                return;
            }

            const expectedArrivalTime = await fetchRoute(
                fromCoords,
                toCoords,
                departureTime
            );

            if (expectedArrivalTime) {
                console.log("Setting expected arrival time:", expectedArrivalTime);
                setToWaypoint(prev => ({
                    ...prev,
                    expected: expectedArrivalTime
                }));
                setExpectedArrivalTime(expectedArrivalTime.toISOString());
            }
        }, 1000),
        [] // Empty dependency array since debounce is stable
    );

    // Update expected arrival time when coordinates or departure time changes
    useEffect(() => {
        console.log("Coordinates changed:", { fromCoords, toCoords, date: date.toDate() });
        if (fromCoords && toCoords) {
            updateExpectedArrival(fromCoords, toCoords, date.toDate(), setToWaypoint);
        }
    }, [fromCoords, toCoords, date, updateExpectedArrival]);

    // Handle Address Selection
    const handleAddressSelect = async (place: any, type: string) => {
        console.log("Address selected:", { place, type });
        if(type === "from") {
            setFromText(place.place_name);
            const destination = { lat: place.center[1], lng: place.center[0] };
            setFrom(destination);
            setFromSearchResults([]);
            setFromWaypoint({
                geo_text: place.place_name,
                latitude: place.center[1],
                longitude: place.center[0],
                expected: date.toDate(),
            });
            setFromCoords(destination);
            console.log("Set from coordinates:", destination);

        } else {
            setToText(place.place_name);
            const destination = { lat: place.center[1], lng: place.center[0] };
            setTo(destination);
            setToSearchResults([]);
            setToWaypoint({
                geo_text: place.place_name,
                latitude: place.center[1],
                longitude: place.center[0],
                expected: null,
            });
            setToCoords(destination);
            console.log("Set to coordinates:", destination);
        }
    };

    useEffect(() => {
        if(!riderFlowBody) {
            navigate('/find-ride');
            return;
        }

        // check if the json is empty
        if(Object.keys(riderFlowBody).length === 0) {
            navigate('/find-ride');
            return;
        }

        // check if the body property exists and is not empty
        if(!riderFlowBody.body || Object.keys(riderFlowBody.body).length === 0) {
            navigate('/find-ride');
            return;
        }

    }, [riderFlowBody, navigate]);

    useEffect(() => {
        setTripDate(date.toDate());
    }, [date]);

    return (

        <div className="flex flex-col h-screen w-full bg-white dark:bg-[#0c0c0c] p-6">
            <h1 className="text-3xl font-RobotoBold text-black dark:text-white">
                Request a ride
            </h1>

            <h1 className="text-sm lg:text-lg w-full lg:w-1/2 mt-2 font-RobotoMedium text-gray-800 dark:text-gray-300">
                Fill in the details of where you would like to go and when you would like to go. {" "}
                Drivers that have similar home addresses or trips to that destination around that time {" "}
                will be notified. The request will also be shown on the driver's side feed.
            </h1>

            <div className="relative flex flex-col w-full lg:w-1/2 h-full">
                <div className=" flex mt-4 flex-col w-full items-center justify-center rounded-xl p- bg-white dark:bg-[#0c0c0c]">
                        <div className="relative mt- w-full">
                            <Input
                                label="From"
                                placeholder="From where?"
                                value={fromText}
                                className="w-full"
                                onChange={(e) => {
                                    setFromText(e.target.value);
                                    debouncedSearchAddress(e.target.value, "from", setFromSearchResults);
                                }}
                            />
                            {fromSearchResults.length > 0 && (
                                <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                                    {fromSearchResults.map((place, index) => (
                                        <div
                                            key={index}
                                            className="p-2 cursor-pointer hover:bg-gray-200"
                                            onClick={() => handleAddressSelect(place, "from")}
                                        >
                                            {place.place_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="relative mt-4 w-full">
                            <Input
                                label="To"
                                placeholder="To where?"
                                value={toText}
                                className="w-[]"
                                onChange={(e) => {
                                    setToText(e.target.value);
                                    debouncedSearchAddress(e.target.value, "to", setToSearchResults);
                                }}
                            />
                            {toSearchResults.length > 0 && (
                            <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                                {toSearchResults.map((place, index) => (
                                    <div
                                        key={index}
                                        className="p-2 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleAddressSelect(place, "to")}
                                    >
                                        {place.place_name}
                                    </div>
                                ))}
                                    </div>
                            )}
                        </div>
                        <div className="flex flex-row w-full mt-4 space-x-4">
                            <DatePicker
                                className="w-full "
                                granularity="second"
                                label="Date and time"
                                minValue={today(getLocalTimeZone())}
                                value={parseAbsoluteToLocal(new Date(tripDate || new Date()).toISOString())}
                                onChange={setDate}
                            />
                        </div>

                        <div className="flex flex-col w-full mt-4">
                        <Checkbox
                            className="text-black dark:text-white flex"
                            checked={willingToPayForGas}
                            onChange={() => setWillingToPayForGas(!willingToPayForGas)}
                        >I am willing to pay for gas</Checkbox>
                        
                        <Checkbox
                            className="text-black dark:text-white flex"
                            checked={willingToPayForFood}
                            onChange={() => setWillingToPayForFood(!willingToPayForFood)}
                        >I am willing to pay for food</Checkbox>
                        </div>

                        {
                            isFemale && (
                                <div className="flex flex-col w-full mt-4">
                                    <Checkbox
                                        className="text-black dark:text-white"
                                        checked={femaleDriversOnlyOption}
                                        onChange={() => setFemaleDriversOnlyOption(!femaleDriversOnlyOption)}
                                    >Female drivers only</Checkbox>
                                </div>
                            )
                        }

                        <div className="flex w-full my-4 bg-slate-300 dark:bg-neutral-700 h-[2px]"></div>
                        

                        <div className="flex flex-col w-full mt-">
                            <Checkbox
                                className="text-black dark:text-white"
                                checked={termsAccepted.guaranteed_ride}
                                onChange={() => setTermsAccepted({...termsAccepted, guaranteed_ride: !termsAccepted.guaranteed_ride})}
                            >I accept that this ride request is not guaranteed to be fulfilled.
                            </Checkbox>
                            <Checkbox
                                className="text-black mt-4 dark:text-white"
                                checked={termsAccepted.feed}
                                onChange={() => setTermsAccepted({...termsAccepted, feed: !termsAccepted.feed})}
                            >I accept that this ride request will be shown on the driver's feed. My full destination address will be shown.
                            </Checkbox>
                        </div>
    
                        <Button
                            className="w-full mt-6"
                            color="primary"
                            onPress={() => {

                                let newRiderFlowBody = {
                                    body: {
                                        ...riderFlowBody.body,
                                        to: {
                                            ...riderFlowBody.body.to,
                                            expected: expectedArrivalTime
                                        }
                                    },
                                    pay_for_gas: willingToPayForGas,
                                    pay_for_food: willingToPayForFood,
                                }

                                if(!termsAccepted.guaranteed_ride || !termsAccepted.feed) {
                                    addToast({
                                        title: "Terms and conditions not accepted",
                                        description: "You must accept the terms and conditions to request a ride.",
                                        color: "danger"
                                    });
                                    console.log("riderFlowBody", newRiderFlowBody);
                                    return;
                                }

                                fetch(`${fetchBase}/v1/trip/rider/request`, {
                                    method: "POST",
                                    credentials: "include",
                                    headers: {
                                        "Content-Type": "application/json",
                                        'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                                        'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
                                    },
                                    body: JSON.stringify(newRiderFlowBody)
                                }).then(res => res.json()).then(data => {
                                    if(data.success) {
                                        navigate(`/rider-flow/trips?tab=created`);
                                    } else {
                                        console.error(data.error);
                                    }
                                }).catch(err => {
                                    console.error(err);
                                })
                            }}
                        >
                            Request Ride
                        </Button>
                    </div>
                </div>
        </div>
    )
}

export default RiderFlowRequest