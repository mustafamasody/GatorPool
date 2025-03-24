import React, { useState, useEffect, useRef } from 'react';
import { AccountData } from '../../view_controller';
import { Button, Input } from '@heroui/react';
import {DatePicker} from "@heroui/react";
import {parseDate, getLocalTimeZone} from "@internationalized/date";
import fetchBase from '../../../common/fetchBase';
import {now, parseAbsoluteToLocal, today} from "@internationalized/date";
import mapboxgl from 'mapbox-gl';
import { Feature, Polygon } from "geojson";
import { CreateTripDriverFlowOptionsEntity } from '../types';
import CreatePage2 from './create_page2';
import {Progress} from "@heroui/react";
import CreatePage3 from './create_page3';
import CreatePage4 from './create_page4';
import CreatePage5 from './create_page5';


const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibXVzdGFmYW1hc29keSIsImEiOiJjbTZva3FneTIwZjI5MmxvdWQ1dHY1NTlwIn0.oNPGEBsenNviLdx_qzcPWw';

interface CreateTripProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

let testObject = `
{
    "from": {
        "text": "University of Florida",
        "lat": 29.644906,
        "lng": -82.350441,
        "expected": 1742409922000
    },
    "radius": 15,
    "carpool": false
}`;

const CreateTrip: React.FC<CreateTripProps> = ({ accountData, setAccountData }) => {

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

    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    const [fromSearchResults, setFromSearchResults] = useState<any[]>([]);
    const [toSearchResults, setToSearchResults] = useState<any[]>([]);

    const [tripOptions, setTripOptions] = useState<CreateTripDriverFlowOptionsEntity>(JSON.parse(testObject));

    const [currentPage, setCurrentPage] = useState<number>(1);

    // Updated search function
    const searchAddress = async (query: string, type: string) => {
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
    };
    
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
        setTripOptions({
            ...tripOptions,
            from: {
                ...tripOptions.from,
                expected: date.toDate().getTime(),
            },
            datetime: date.toDate().toISOString(),
        });
    }, [date]);

    useEffect(() => {
        console.log(tripOptions)
    }, [tripOptions])

    // Handle Address Selection
    const handleAddressSelect = async (place: any, type: string) => {
        if(type === "from") {
            setFromText(place.place_name);
            const destination = { lat: place.center[1], lng: place.center[0] };
            setFrom(destination);
            setFromSearchResults([]);
            setTripOptions({
                ...tripOptions,
                from: {
                    text: place.place_name,
                    lat: place.center[1],
                    lng: place.center[0],
                    expected: date.toDate().getTime(),
                }
            });
    
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
    
            if (mapRef.current) {
                new mapboxgl.Marker()
                    .setLngLat(place.center)
                    .setPopup(new mapboxgl.Popup().setHTML(`<b>Destination</b><br>${place.place_name}`))
                    .addTo(mapRef.current);
    
                mapRef.current.flyTo({
                    center: place.center,
                    zoom: 14,
                });
    
                let expectedTime: Date = await fetchRoute(destination); // Fetch the best route
                setTripOptions({
                    ...tripOptions,
                    to: {
                        text: place.place_name,
                        lat: place.center[1],
                        lng: place.center[0],
                        expected: expectedTime.getTime(),
                    },
                });
            }
        }
    };

    // Function to generate a circular GeoJSON around a point

    const createCircle = (center: { lat: number; lng: number }, radius: number): Feature<Polygon> => {
        const points = 64; // Smooth circle
        const coords: [number, number][] = [];
        const earthRadius = 6371; // Earth radius in km
        const radiusKm = radius * 1.60934; // Convert miles to km
    
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * (2 * Math.PI);
            const dx = radiusKm / earthRadius * Math.cos(angle);
            const dy = radiusKm / earthRadius * Math.sin(angle);
    
            const newLng = center.lng + (dx * (180 / Math.PI));
            const newLat = center.lat + (dy * (180 / Math.PI));
    
            coords.push([newLng, newLat]);
        }
    
        coords.push(coords[0]); // Close the polygon
    
        return {
            type: "Feature",
            properties: {}, // ✅ Ensure 'properties' is included
            geometry: {
                type: "Polygon",
                coordinates: [coords],
            },
        };
    };
    
    

// Add/Update the circle when the "To" destination or radius changes
useEffect(() => {
    if (!mapRef.current || !to) return;

    const map = mapRef.current;
    const circleData = createCircle(to, destinationRadius);
    setTripOptions({
        ...tripOptions,
        radius: destinationRadius,
    });

    if (map.getSource("destinationCircle")) {
        (map.getSource("destinationCircle") as mapboxgl.GeoJSONSource).setData(circleData);
    } else {
        map.addSource("destinationCircle", {
            type: "geojson",
            data: circleData,
        });

        map.addLayer({
            id: "destinationCircle",
            type: "fill",
            source: "destinationCircle",
            layout: {},
            paint: {
                "fill-color": "#007AFF",
                "fill-opacity": 0.3,
            },
        });
    }
}, [to, destinationRadius]); // ✅ Updates the shaded circle dynamically when 'to' or 'destinationRadius' changes


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

    return (
        <div className="flex flex-col space-y- bg-white dark:bg-black h-screen p-8">
            <Progress aria-label="Loading..." className="mb-4 max-w-full" value={
                currentPage === 1 ? 20 : 
                currentPage === 2 ? 40 :
                currentPage === 3 ? 60 :
                currentPage === 4 ? 80 :
                currentPage === 5 ? 100 : 0
            } />
            <div className="flex flex-col md:flex-row w-full space-x-12">
                <div className={`flex ${currentPage === 5 ? "w-full" : "w-full lg:w-1/2"}`}>
                {
                currentPage === 1 && (
                        <div className="flex flex-col w-full h-[24rem] my-auto items-center justify-center border border-1 border-neutral-700 rounded-xl p-8">
                            <p className="text-xl font-RobotoBold  text-left mr-auto mb-4 text-black dark:text-white">Create a Trip</p>
                            <div className="relative mt- w-full">
                                <Input
                                    label="From"
                                    placeholder="From where?"
                                    value={tripOptions?.from?.text}
                                    className="w-full"
                                    onChange={(e) => {
                                        setTripOptions({
                                            ...tripOptions,
                                            from: {
                                                ...tripOptions.from,
                                                text: e.target.value,
                                            }
                                        });
                                        searchAddress(e.target.value, "from");
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
                                    value={tripOptions?.to?.text}
                                    className="w-[]"
                                    onChange={(e) => {
                                        setTripOptions({
                                            ...tripOptions,
                                            to: {
                                                ...tripOptions.to,
                                                text: e.target.value,
                                            }
                                        });
                                        searchAddress(e.target.value, "to");
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
                                    className="w-2/3 "
                                    granularity="second"
                                    label="Date and time"
                                    minValue={today(getLocalTimeZone())}
                                    value={parseAbsoluteToLocal(new Date(tripOptions?.datetime || new Date()).toISOString())}
                                    onChange={setDate}
                                />
                                <Input
                                    label="Radius (miles)"
                                    type="number"
        
                                    placeholder="Enter the radius number"
                                    value={"" + tripOptions?.radius}
                                    className="text-black dark:text-white w-1/3"
                                    onChange={(e) => {
                                        setDestinationRadius(parseInt(e.target.value));
                                        setTripOptions({
                                            ...tripOptions,
                                            radius: parseInt(e.target.value),
                                        });
                                    }}
                                />
                            </div>
        
                            <Button
                                className="w-full mt-4"
                                color="primary"
                                onClick={() => {
                                    setCurrentPage(2);
                                }}
                            >
                                Next
                            </Button>
                        </div>
                )
            }

            {
                currentPage === 2 && (
                    <CreatePage2
                    tripOptions={tripOptions}
                    setTripOptions={setTripOptions}
                    accountData={accountData}
                    setCurrentPage={setCurrentPage}
                    />
                )
            }

            {
                currentPage === 3 && (
                    <CreatePage3
                    tripOptions={tripOptions}
                    setTripOptions={setTripOptions}
                    accountData={accountData}
                    setCurrentPage={setCurrentPage}
                    />
                )
            }

            {
                currentPage === 4 && (
                    <CreatePage4
                    tripOptions={tripOptions}
                    setTripOptions={setTripOptions}
                    accountData={accountData}
                    setCurrentPage={setCurrentPage}
                    />
                )
            }

            {
                currentPage === 5 && (
                    <CreatePage5
                    tripOptions={tripOptions}
                    setTripOptions={setTripOptions}
                    accountData={accountData}
                    setCurrentPage={setCurrentPage}
                    />
                )
            }
                </div>

            {
                currentPage !== 5 && (
                    <div className="flex flex-col w-full h-full items-center justify-center">
                        <div id="map-container" ref={mapContainerRef} className="rounded-xl w-10/12 md:w-full h-[400px] lg:h-[500px] xl:h-[700px] threequarterxl3:h-[950px]" />
                    </div>
                )
            }

            </div>
        </div>
    )
}

export default CreateTrip