import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Input, Checkbox } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { RiderQueryEntity } from '../../../common/types/rider_query';
import { REQUEST_HEADERS } from '../../utils/headers';
import { AccountData } from '../../view_controller';
import fetchBase from '../../../common/fetchBase';
import {now, parseAbsoluteToLocal, today} from "@internationalized/date";
import {DatePicker} from "@heroui/react";
import {parseDate, getLocalTimeZone} from "@internationalized/date";
import mapboxgl from 'mapbox-gl';
import { WaypointEntity } from '../../../common/types/waypoint';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { debounce } from '../../utils/debounce';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibXVzdGFmYW1hc29keSIsImEiOiJjbTZva3FneTIwZjI5MmxvdWQ1dHY1NTlwIn0.oNPGEBsenNviLdx_qzcPWw';

interface RiderFlowQueryProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const RiderFlowQuery = ({ accountData, setAccountData }: RiderFlowQueryProps) => {

    const [pastQueries, setPastQueries] = useState<RiderQueryEntity[]>([]); 

    const fetchQueries = async () => {
        fetch(`${fetchBase}/v1/rider/queries`, {
            method: 'GET',
            credentials: 'include',
            headers: REQUEST_HEADERS
        }).then(res => res.json()).then(data => {
            if(data.success) {
                setPastQueries(data.queries);
            } else {
                console.error(data.error);
            }
        }).catch(err => {
            console.error(err);
        })
    };

    const [from, setFrom] = useState<{ lat: number, lng: number }>({
        lat: 29.6436,
        lng: -82.3549
    });
    const [to, setTo] = useState<{ lat: number, lng: number } | null>(null);
    const [fromText, setFromText] = useState("University of Florida");
    const [toText, setToText] = useState("");
    const [route, setRoute] = useState<any>(null); // Stores route GeoJSON

    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [destinationRadius, setDestinationRadius] = useState<any>(0);
    let [date, setDate] = React.useState(parseAbsoluteToLocal(new Date().toISOString()));

    const [tripDate, setTripDate] = useState<Date>(new Date());

    const [fromWaypoint, setFromWaypoint] = useState<WaypointEntity>({});
    const [toWaypoint, setToWaypoint] = useState<WaypointEntity>({});

    const [isFemale, setIsFemale] = useState<boolean>(false);

    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    const [fromSearchResults, setFromSearchResults] = useState<any[]>([]);
    const [toSearchResults, setToSearchResults] = useState<any[]>([]);

    const [filtersDropdownOpen, setFiltersDropdownOpen] = useState<boolean>(false);
    const [flexibleDatesOption, setFlexibleDatesOption] = useState<boolean>(false);
    const [femaleDriversOnlyOption, setFemaleDriversOnlyOption] = useState<boolean>(false);

    // Updated search function with debounce
    const debouncedSearchAddress = useCallback(
        debounce(async (query: string, type: string) => {
            if (query.length < 3) {
                if (type === "from") {
                    setFromSearchResults([]);
                } else {
                    setToSearchResults([]);
                }
                return;
            }

            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=5`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (type === "from") {
                    setFromSearchResults(data.features || []);
                } else {
                    setToSearchResults(data.features || []);
                }
            } catch (error) {
                console.error("Error fetching geocode data:", error);
            }
        }, 500),
        []
    );
    
    useEffect(() => {
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        if (!mapContainerRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mustafamasody/cm6olrhpt000k01qrebc2e55u',
            center: [from.lng, from.lat],
            zoom: 14,
        });

        new mapboxgl.Marker()
            .setLngLat([from.lng, from.lat])
            .setPopup(new mapboxgl.Popup().setHTML("<b>University of Florida</b><br>Reitz Union"))
            .addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
        };
    }, []);

    // Fetch Route from Mapbox Directions API
    const fetchRoute = async (destination: { lat: number, lng: number }) => {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;
    
        try {
            const response = await fetch(url);
            const data = await response.json();
            const routeGeoJSON = data.routes[0]?.geometry;
    
            if (routeGeoJSON && mapRef.current) {
                const map = mapRef.current;
    
                // Check if source exists
                const existingSource = map.getSource("route") as mapboxgl.GeoJSONSource;
    
                if (existingSource) {
                    // ✅ Set new route data if source already exists
                    existingSource.setData({
                        type: "FeatureCollection",
                        features: [{ type: "Feature", geometry: routeGeoJSON, properties: {} }]
                    });
                } else {
                    // ✅ If source does not exist, create it
                    map.addSource("route", {
                        type: "geojson",
                        data: {
                            type: "FeatureCollection",
                            features: [{ type: "Feature", geometry: routeGeoJSON, properties: {} }]
                        }
                    });
    
                    map.addLayer({
                        id: "route",
                        type: "line",
                        source: "route",
                        layout: { "line-cap": "round", "line-join": "round" },
                        paint: {
                            "line-color": "#007AFF",
                            "line-width": 5,
                            "line-opacity": 0.75
                        }
                    });
                }
    
                // ✅ Adjust map to fit the route
                map.fitBounds(
                    [
                        [from.lng, from.lat],
                        [destination.lng, destination.lat]
                    ],
                    { padding: 50, maxZoom: 14 }
                );

                // Get the expected arrival time
                const expectedArrivalTime = new Date(date.toDate().getTime() + data.routes[0].duration * 1000);
                return expectedArrivalTime;
            }
        } catch (error) {
            console.error("Error fetching route:", error);
        }
    };

    useEffect(() => {
        setTripDate(date.toDate());
    }, [date]);

    // Handle Address Selection
    const handleAddressSelect = async (place: any, type: string) => {
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
            })
    
            if (mapRef.current) {
                new mapboxgl.Marker()
                    .setLngLat(place.center)
                    .setPopup(new mapboxgl.Popup().setHTML(`<b>From</b><br>${place.place_name}`))
                    .addTo(mapRef.current);
    
                mapRef.current.flyTo({
                    center: place.center,
                    zoom: 14,
                });
    
            }
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
            })
    
            if (mapRef.current) {
                new mapboxgl.Marker()
                    .setLngLat(place.center)
                    .setPopup(new mapboxgl.Popup().setHTML(`<b>Destination</b><br>${place.place_name}`))
                    .addTo(mapRef.current);
    
                mapRef.current.flyTo({
                    center: place.center,
                    zoom: 14,
                });
    
            }
        }
    };

    // Add route layer when the map loads
    useEffect(() => {
        if (mapRef.current && route) {
            if (!mapRef.current.getSource("route")) {
                mapRef.current.addSource("route", {
                    type: "geojson",
                    data: {
                        type: "FeatureCollection",
                        features: [{ type: "Feature", geometry: route, properties: {} }]
                    }
                });

                mapRef.current.addLayer({
                    id: "route",
                    type: "line",
                    source: "route",
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: {
                        "line-color": "#007AFF",
                        "line-width": 5,
                        "line-opacity": 0.75
                    }
                });
            }
        }
    }, [route]);

    useEffect(() => {
        fetchQueries();
        fetch(`${fetchBase}/v1/rider/gender`, {
            method: 'GET',
            credentials: 'include',
            headers: REQUEST_HEADERS
        }).then(res => res.json()).then(data => {
            setIsFemale(data.gender === "female");
        })
    }, []);

    return (
        <div>
            <div className="flex flex-col h-screen items-center justify-center w-full bg-white dark:bg-black p-6">
            <div className="relative flex flex-col w-full h-full items-center justify-center">
                <div id="map-container" className="relativerounded-xl w-full h-full" />
                    <div className="absolute top-4 left-4 flex flex-col w-[24rem] items-center justify-center border border-1 border-neutral-300 dark:border-neutral-800 rounded-xl p-8 bg-white dark:bg-black">
                        <p className="text-xl font-RobotoBold  text-left mr-auto mb-4 text-black dark:text-white">Find a ride</p>
                            <div className="relative mt- w-full">
                                <Input
                                    label="From"
                                    placeholder="From where?"
                                    value={fromText}
                                    className="w-full"
                                    onChange={(e) => {
                                        setFromText(e.target.value);
                                        debouncedSearchAddress(e.target.value, "from");
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
                                        debouncedSearchAddress(e.target.value, "to");
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

                            <button
                                onClick={() => setFiltersDropdownOpen(!filtersDropdownOpen)}
                                className="w-fit px-4 py-2 rounded-xl mr-auto mt-4 flex bg-neutral-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 flex-row items-center space-x-2 justify-start text-black dark:text-white"
                            >
                                <span>Additional Filters</span>
                                {
                                    filtersDropdownOpen ? (
                                        <ChevronUpIcon className="w-4 h-4" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4" />
                                    )
                                }
                            </button>

                            {
                                filtersDropdownOpen && (
                                    <div className="flex flex-col w-full mt-1">
                                        <Checkbox
                                            className="text-black dark:text-white"
                                            checked={flexibleDatesOption}
                                            onChange={() => setFlexibleDatesOption(!flexibleDatesOption)}
                                        >Flexible dates</Checkbox>
                                        {
                                            isFemale && (
                                                <Checkbox
                                                    className="text-black dark:text-white"
                                                    checked={femaleDriversOnlyOption}
                                                    onChange={() => setFemaleDriversOnlyOption(!femaleDriversOnlyOption)}
                                                >Female drivers only</Checkbox>
                                            )
                                        }
                                    </div>
                                )
                            }
        
                            <Button
                                className="w-full mt-4"
                                color="primary"
                                onPress={() => {
                                    fetch(`${fetchBase}/v1/trip/rider/query`, {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: REQUEST_HEADERS,
                                        body: JSON.stringify({
                                            body: {
                                                from: {
                                                    lat: fromWaypoint.latitude,
                                                    lng: fromWaypoint.longitude,
                                                },
                                                to: {
                                                    lat: toWaypoint.latitude,
                                                    lng: toWaypoint.longitude,
                                                },
                                                datetime: tripDate.toISOString(),
                                                flexible_dates: flexibleDatesOption,
                                                females_only: femaleDriversOnlyOption,
                                            }
                                        })
                                    }).then(res => res.json()).then(data => {
                                        console.log(data);
                                    }).catch(err => {
                                        console.error(err);
                                    })
                                }}
                            >
                                Find
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default RiderFlowQuery