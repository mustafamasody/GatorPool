import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { AccountData } from "../../view_controller";
import { debounce } from "../../utils/debounce";
import { now, parseAbsoluteToLocal, today } from "@internationalized/date";
import { parseDate, getLocalTimeZone } from "@internationalized/date";
import mapboxgl from "mapbox-gl";
import { WaypointEntity } from "../../../common/types/waypoint";
import { Button, DatePicker, Input } from "@heroui/react";
import { TripEntity } from "../../../common/types/trip_entity";
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

  const [tripDate, setTripDate] = useState<Date>(new Date());

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
                console.log("Button clicked");
            }}
        >
            Find Rides
        </Button>
      </div>

      {
        !tripResults && (
            <>
                <div className="flex flex-col w-full h-max mt-16 items-center justify-center">
                    <h1 className="text-2xl font-PoppinsBold text-black dark:text-white">Start a search to find rides</h1>
                </div>
            </>
        )
      }

      {
        tripResults && tripResults.length === 0 && (
            <>
                <div className="flex flex-col w-full h-max mt-16 items-center justify-center">
                    <h1 className="text-2xl font-PoppinsBold text-black dark:text-white">No trips found</h1>
                </div>
            </>
        )
      }
    </div>
  );
};

export default Feed;
