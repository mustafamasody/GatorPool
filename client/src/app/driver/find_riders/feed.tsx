import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { AccountData } from "../../view_controller";
import { debounce } from "../../utils/debounce";
import { now, parseAbsoluteToLocal, today } from "@internationalized/date";
import { parseDate, getLocalTimeZone } from "@internationalized/date";
import mapboxgl from "mapbox-gl";
import { WaypointEntity } from "../../../common/types/waypoint";
import { Button, Checkbox, DatePicker, Input, NumberInput } from "@heroui/react";
import { TripEntity } from "../../../common/types/trip_entity";
import fetchBase from "../../../common/fetchBase";
import { addToast } from "@heroui/react";
import { RiderProfile } from "../../../common/types/rider_info";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoibXVzdGFmYW1hc29keSIsImEiOiJjbTZva3FneTIwZjI5MmxvdWQ1dHY1NTlwIn0.oNPGEBsenNviLdx_qzcPWw";

interface FeedProps {
  accountData: AccountData;
  setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

// Debounced search function outside component
const debouncedSearchAddress = debounce(
  async (query: string, type: string, setResults: (results: any[]) => void) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=5`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      setResults(data.features || []);
    } catch (error) {
      console.error("Error fetching geocode data:", error);
      setResults([]);
    }
  },
  500
);

const Feed = ({ accountData, setAccountData }: FeedProps) => {
  const [from, setFrom] = useState<{ lat: number; lng: number }>({
    lat: 29.6436,
    lng: -82.3549,
  });
  const [to, setTo] = useState<{ lat: number; lng: number } | null>(null);
  const [fromText, setFromText] = useState("University of Florida");
  const [toText, setToText] = useState("");
  const [route, setRoute] = useState<any>(null); // Stores route GeoJSON

  const navigate = useNavigate();

  const [fromSearchResults, setFromSearchResults] = useState<any[]>([]);
  const [toSearchResults, setToSearchResults] = useState<any[]>([]);

  const [fromWaypoint, setFromWaypoint] = useState<WaypointEntity>({
    geo_text: "University of Florida",
    latitude: 29.6436,
    longitude: -82.3549,
  });

  const [toWaypoint, setToWaypoint] = useState<WaypointEntity>({});

  let [date, setDate] = React.useState(
    parseAbsoluteToLocal(new Date().toISOString())
  );

  const [tripResults, setTripResults] = useState<TripEntity[]>(null);
  const [riderProfiles, setRiderProfiles] = useState<RiderProfile[]>([]);

  const [requestedTrip, setRequestedTrip] = useState<TripEntity | null>(null);

  const [tripDate, setTripDate] = useState<Date>(new Date());

  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  const [foodCost, setFoodCost] = useState<number>(0);
  const [gasCost, setGasCost] = useState<number>(0);
  const [tripCost, setTripCost] = useState<number>(0);

  const [totalFare, setTotalFare] = useState<number>(0);

  useEffect(() => {
    let total = 0;
    total += Number(foodCost) || 0;
    total += Number(gasCost) || 0;
    total += Number(tripCost) || 0;
    setTotalFare(total);
  }, [foodCost, gasCost, tripCost]);

  useEffect(() => {
    setTripDate(date.toDate());
  }, [date]);

  // Handle Address Selection
  const handleAddressSelect = async (place: any, type: string) => {
    if (type === "from") {
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
    } else {
      setToText(place.place_name);
      const destination = { lat: place.center[1], lng: place.center[0] };
      setTo(destination);
      setToSearchResults([]);
      // let expectedTime: Date = await fetchRoute(destination); // Fetch the best route
      setToWaypoint({
        geo_text: place.place_name,
        latitude: place.center[1],
        longitude: place.center[0],
        expected: null,
      });
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-col gap-4 lg:flex-row items-center w-full">
        <div className="relative mt- w-full">
          <Input
            label="From"
            placeholder="From where?"
            value={fromText}
            className="w-full"
            onChange={(e) => {
              setFromText(e.target.value);
              debouncedSearchAddress(
                e.target.value,
                "from",
                setFromSearchResults
              );
            }}
          />
          {fromSearchResults.length > 0 && (
            <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
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

        <div className="relative w-full">
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
            <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
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

        <div className="flex flex-row w-full space-x-4">
          <DatePicker
            className="w-full "
            granularity="second"
            label="Date and time"
            minValue={today(getLocalTimeZone())}
            value={parseAbsoluteToLocal(
              new Date(tripDate || new Date()).toISOString()
            )}
            onChange={setDate}
          />
        </div>

        <Button
            className="w-64"
            variant="solid"
            color="primary"
            onClick={() => {
                const body = {
                    body: {
                        from: fromWaypoint,
                        to: toWaypoint,
                        datetime: tripDate.toISOString(),
                    }
                }

                fetch(`${fetchBase}/v1/trip/driver/feed`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                        'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
                    },
                    body: JSON.stringify(body),
                }).then(res => res.json()).then(data => {
                    if(data.success) {
                        setTripResults(data.trips);
                        setRiderProfiles(data.riderProfiles);
                    } else {
                        addToast({
                            title: "Error fetching trips",
                            description: data.error,
                            color: "danger"
                        });
                    }
                }).catch(err => {
                    addToast({
                        title: "Error fetching trips",
                        description: "Please try again.",
                        color: "danger"
                    });
                    console.error(err);
                })
            }}
        >
            Find Rides
        </Button>
      </div>

      {
        !tripResults && (
            <>
                <div className="flex flex-col w-full h-max mt-16 items-center justify-center">
                    <h1 className="text-2xl font-RobotoBold text-black dark:text-white">Start a search to find rides</h1>
                </div>
            </>
        )
      }

      {
        tripResults && tripResults.length === 0 && (
            <>
                <div className="flex flex-col w-full h-max mt-16 items-center justify-center">
                    <h1 className="text-2xl font-RobotoBold text-black dark:text-white">No trips found</h1>
                </div>
            </>
        )
      }

      {
        tripResults && tripResults.length > 0 && (
            <div className="flex overflow-x-auto max-w-screen mt-4">
            <table className="w-full">
                <thead>
                    <tr>
                        <th className="text-left px-6 py-4 text-black dark:text-white">To</th>
                        <th className="text-left px-6 py-4 text-black dark:text-white">Requested By</th>
                        <th className="text-left px-6 py-4 text-black dark:text-white">Pickup Time</th>
                        <th className="text-left px-6 py-4 text-black dark:text-white">Rider willing to</th>
                        <th className="text-left px-6 py-4 text-black dark:text-white">Trip Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tripResults.map((trip) => (
                        <tr onClick={() => {
                            // navigate(`/ridertrip/created/${trip.trip_uuid}`);
                        }} className="hover:cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-900" key={trip.trip_uuid}>
                            <td className="text-left text-black dark:text-white px-6 py-4">{trip.waypoints.find((waypoint) => waypoint.type === "destination")?.geo_text}</td>
                            <td className="text-left text-black dark:text-white px-6 py-4">
                                <div className="flex flex-row items-center gap-3">
                                    <img src={riderProfiles.find((profile) => profile.user_uuid === trip.posted_by)?.profile_picture} className="w-10 h-10 rounded-full" />
                                    <div className="flex flex-col">
                                        <h1 className="text-sm font-RobotoBold text-black dark:text-white">{riderProfiles.find((profile) => profile.user_uuid === trip.posted_by)?.first_name} {riderProfiles.find((profile) => profile.user_uuid === trip.posted_by)?.last_name}</h1>
                                        <h1 className="text-xs font-RobotoBold text-black dark:text-white">Gender: {riderProfiles.find((profile) => profile.user_uuid === trip.posted_by)?.gender?.charAt(0).toUpperCase() + riderProfiles.find((profile) => profile.user_uuid === trip.posted_by)?.gender?.slice(1)}</h1>
                                    </div>
                                </div>
                            </td>
                            <td className="text-left text-black dark:text-white px-6 py-4">{new Date(trip.datetime).toLocaleString()}</td>
                            <td className="text-left text-black dark:text-white px-6 py-4">
                                <div className="flex flex-col  gap-0">
                                    <h1 className="text-sm font-RobotoBold text-black dark:text-white">Pay for food: {trip.riders.find((rider) => rider.user_uuid === trip.posted_by)?.willing.pay_food ? "Yes" : "No"}</h1>
                                    <h1 className="text-sm font-RobotoBold text-black dark:text-white">Pay for gas: {trip.riders.find((rider) => rider.user_uuid === trip.posted_by)?.willing.pay_gas ? "Yes" : "No"}</h1>
                                </div>
                            </td>
                            <td className="text-left text-black dark:text-white px-6 py-4">
                                <Button
                                color="primary"
                                onPress={() => {
                                    setRequestedTrip(trip);
                                    // navigate(`/ridertrip/created/${trip.trip_uuid}`);
                                }}>
                                    Request to drive
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        )
      }

      {
        requestedTrip && (
            <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="flex flex-col min-w-96 h-auto bg-white dark:bg-neutral-900 rounded-xl p-6">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="text-lg font-RobotoBold text-black dark:text-white">Trip Request</h1>
                        <button 
                            onClick={() => {
                                setRequestedTrip(null);
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full">
                            <X className="w-6 h-6 text-black dark:text-white" />
                        </button>
                    </div>

                    <div className="flex flex-row items-center gap-3 mt-3">
                        <img src={riderProfiles.find((profile) => profile.user_uuid === requestedTrip.posted_by)?.profile_picture} className="w-10 h-10 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-RobotoBold text-black dark:text-white">{riderProfiles.find((profile) => profile.user_uuid === requestedTrip.posted_by)?.first_name} {riderProfiles.find((profile) => profile.user_uuid === requestedTrip.posted_by)?.last_name}</h1>
                            <h1 className="text-xs font-RobotoBold text-black dark:text-white">Gender: {riderProfiles.find((profile) => profile.user_uuid === requestedTrip.posted_by)?.gender?.charAt(0).toUpperCase() + riderProfiles.find((profile) => profile.user_uuid === requestedTrip.posted_by)?.gender?.slice(1)}</h1>
                        </div>
                    </div>

                    <h1 className="mt-3 text-md font-RobotoRegular text-black dark:text-white">
                        When: {new Date(requestedTrip.datetime).toLocaleString()}
                    </h1>

                    <h1 className="mt-3 text-md font-RobotoRegular text-black dark:text-white">
                        Pickup: {requestedTrip.waypoints.find((waypoint) => waypoint.type === "destination")?.geo_text}
                    </h1>

                    <h1 className="mt-3 text-md font-RobotoRegular text-black dark:text-white">
                        Set your fare:
                    </h1>

                    <NumberInput
                        label="Food Cost"
                        value={foodCost}
                        onChange={(e) => setFoodCost(e.target.value)}
                        className="mt-3"
                    />

                    <NumberInput
                        label="Gas Cost"
                        value={gasCost}
                        onChange={(e) => setGasCost(e.target.value)}
                        className="mt-3"
                    />

                    <NumberInput
                        label="Trip Cost"
                        value={tripCost}
                        onChange={(e) => setTripCost(e.target.value)}
                        className="mt-3"
                    />

                    <h1 className="mt-3 text-md font-RobotoRegular text-black dark:text-white">
                        Total Fare: ${totalFare.toFixed(2)}
                    </h1>

                    <Checkbox
                        className="text-black mt-2 dark:text-white flex"
                        checked={termsAccepted}
                        onChange={() => setTermsAccepted(!termsAccepted)}
                    >I accept the terms and conditions. I accept that my request might be rejected.</Checkbox>

                    <Button 
                        className="w-full ml-auto mt-3"
                        variant="solid"
                        color="primary"
                        onClick={() => {
                            if(termsAccepted) {
                                fetch(`${fetchBase}/v1/trip/${requestedTrip.trip_uuid}/driver/request`, {
                                    method: "POST",
                                    credentials: "include",
                                    headers: {
                                        "Content-Type": "application/json",
                                        'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id') || '',
                                        'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username') || ''
                                    },
                                    body: JSON.stringify({
                                        food: Number(foodCost),
                                        gas: Number(gasCost),
                                        trip: Number(tripCost),
                                        total: Number(totalFare)
                                    })
                                }).then(res => res.json()).then(data => {
                                    if(data.success) {
                                        // setRequestedTrip(null);
                                        navigate('/find-riders?tab=requested');
                                        setRequestedTrip(null);
                                    } else {
                                        addToast({
                                            title: "Error",
                                            description: data.error,
                                            color: "danger"
                                        });
                                    }
                                }).catch(err => {
                                    addToast({
                                        title: "Error",
                                        description: "Please try again.",
                                        color: "danger"
                                    });
                                })
                            } else {
                                addToast({
                                    title: "Error",
                                    description: "Please accept the terms and conditions.",
                                    color: "danger"
                                });
                            }
                        }}
                    >Request to drive</Button>
                </div>
            </div>
        )
      }
    </div>
  );
};

export default Feed;
