
import { Button, Input, DatePicker, TimeInput } from '@heroui/react';
import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/navbar';
import { parseDate, parseAbsoluteToLocal } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import mapboxgl from 'mapbox-gl';
import { SvgBlob } from "react-svg-blob";
import image_1 from "../assets/images/login.png";
import home_blob_1 from "../assets/images/home_blob_1.png";
import home_blob_2 from "../assets/images/home_blob_2.png";
import home_blob_3 from "../assets/images/home_blob_3.png";
import DocumentMeta from 'react-document-meta';
import Footer from './components/footer';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Link } from 'react-router-dom';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibXVzdGFmYW1hc29keSIsImEiOiJjbTZva3FneTIwZjI5MmxvdWQ1dHY1NTlwIn0.oNPGEBsenNviLdx_qzcPWw';

const HomePage = () => {

    const meta = {
        title: 'GatorPool',
        description: 'GatorPool',
        canonical: 'https://gatorpool.app',
        meta: {
            charset: 'utf-8',
            name: {
                keywords: 'GatorPool, UF, Rideshare, Rides, Pool, Carpool, Uber, Lyft',
            },
        },
    };

    const [from, setFrom] = useState<{ lat: number, lng: number }>({
        lat: 29.6436,
        lng: -82.3549
    });
    const [to, setTo] = useState<{ lat: number, lng: number } | null>(null);
    const [fromText, setFromText] = useState("Near Reitz Union");
    const [toText, setToText] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [route, setRoute] = useState<any>(null); // Stores route GeoJSON

    const mapRef = useRef<mapboxgl.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    const [value, setValue] = React.useState(parseDate("2024-04-04"));

    let formatter = useDateFormatter({dateStyle: "full"});

    let [timeValue, setTimeValue] = React.useState(parseAbsoluteToLocal("2024-04-08T18:45:22Z"));

    let timeFormatter = useDateFormatter({dateStyle: "short", timeStyle: "long"});
  
    const [shapeProps, setShapeProps] = useState(null);

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateShapeProps() {
        return {
            size: 500,
            growth: 7,
            edges: 18,
        };
    }

    useEffect(() => {
        // Generate shape props only on the client side
        setShapeProps(generateShapeProps());
    }, []);

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
            }
        } catch (error) {
            console.error("Error fetching route:", error);
        }
    };
    

    // Search for Addresses using Mapbox Geocoding API
    const searchAddress = async (query: string) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=5`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            setSearchResults(data.features || []);
        } catch (error) {
            console.error("Error fetching geocode data:", error);
        }
    };

    // Handle Address Selection
    const handleAddressSelect = (place: any) => {
        setToText(place.place_name);
        const destination = { lat: place.center[1], lng: place.center[0] };
        setTo(destination);
        setSearchResults([]);

        if (mapRef.current) {
            new mapboxgl.Marker()
                .setLngLat(place.center)
                .setPopup(new mapboxgl.Popup().setHTML(`<b>Destination</b><br>${place.place_name}`))
                .addTo(mapRef.current);

            mapRef.current.flyTo({
                center: place.center,
                zoom: 14,
            });

            fetchRoute(destination); // Fetch the best route
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

    return (
        <div className="light dark:dark bg-white dark:bg-[#0c0c0c] flex flex-col h-full min-h-screen w-full">
            <Navbar />
            <DocumentMeta {...meta} />
            <div className="flex flex-col h-full w-full mt-32 px-6">
                <div className="flex flex-col space-y-8 md:space-y-0 md:flex-row md:space-x-8 items-center w-full max-w-screen-lg mx-auto">
                    <div className="flex flex-col md:w-1/2">
                        <h1 className="text-4xl text-black dark:text-white font-RobotoBold">Where would you like to go?</h1>

                        <Input
                            label="From"
                            className="mt-8"
                            value={fromText}
                            onChange={(e) => setFromText(e.target.value)}
                        />

                        {/* To Address Input with Autocomplete */}
                        <div className="relative mt-8">
                            <Input
                                label="To"
                                placeholder="Enter your desired address"
                                value={toText}
                                onChange={(e) => {
                                    setToText(e.target.value);
                                    searchAddress(e.target.value);
                                }}
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                                    {searchResults.map((place, index) => (
                                        <div
                                            key={index}
                                            className="p-2 cursor-pointer hover:bg-gray-200"
                                            onClick={() => handleAddressSelect(place)}
                                        >
                                            {place.place_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-row mt-8 space-x-8 " >
                            <DatePicker
                            className="max-w-[284px] "
                            label="When"
                            value={value}
                            onChange={setValue}
                            />
                            <TimeInput label="Departure Time" value={timeValue} onChange={setTimeValue} />
                        </div>
                        

                        <div className="flex flex-row space-x-2 mt-8 items-center">
                            <Button
                                className=" font-RobotoRegular text-white text-md"
                                onPress={() => {

                                }}
                                color="primary">
                                Book Ride
                            </Button>
                            <Link to="/auth/signin" className="text-neutral-500 underline underline-offset-4 font-RobotoRegular text-sm">Login to see recent activity</Link>
                        </div>
                    </div>

                    {/* Map Container */}
                    <div id="map-container" ref={mapContainerRef} className="rounded-xl w-11/12 md:w-1/2 h-[600px] mt-12" />
                </div>
            </div>

            <div className="flex flex-col h-auto w-full items-center text-black">

                <div className="flex mt-32 bg-white dark:bg-[#0c0c0c] lg:mt-64 flex-col lg:space-x-8 px-4 lg:px-6 lg:flex-row items-center justify-center w-screen md:max-w-screen-lg">
                    <div className="flex md:w-1/2 flex-col spac ">
                        <h1 className="text-center md:text-left text-black dark:text-white font-RobotoBold text-4xl md:text-6xl">
                            Helping gators get home safely.
                        </h1>
                        <p className="text-center md:text-left text-black dark:text-white font-RobotoRegular text-md md:text-lg mt-6 lg:mt-4">
                            No more posting on Reddit or Snapchat for a ride home. We've got you covered.
                        </p>
                    </div>

                    <div className="relative md:w-1/2 justify-center items-center mt-32 lg:mt-0 px- lg:px-0 flex flex-col">
                        {/* Blob positioned behind the image */}
                        <div className="absolute inset-0 flex justify-center items-center z-0">
                            <SvgBlob
                            variant="gradient"
                            colors={["#0de046", "#03631d"]}
                            color="#00cec9"
                            shapeProps={generateShapeProps()}
                            isOutline={false} // Ensure `isOutline` is set to `false` if you don't want an outline
                            className="w-[130%] h-auto" // Adjust size as needed
                            />
                        </div>
                        
                        {/* Image positioned above the blob */}
                        <img src={home_blob_1}
                        className="relative w-full rounded-xl z-20 mt-4 shadow-[0px_10px_30px_rgba(0,0,0,0.3)] custom-3d-tilt" />

                    </div>
                </div>

                <div className="flex my-32 bg-white dark:bg-[#0c0c0c] lg:mt-64 flex-col lg:space-x-8 px-4 lg:px-6 lg:flex-row items-center justify-center w-screen md:max-w-screen-lg">

                    <div className="relative md:w-1/2 justify-center items-center mt-32 lg:mt-0 px- lg:px-0 flex flex-col">
                        {/* Image positioned above the blob */}
                        <img src={home_blob_2}
                        className="relative w-full rounded-xl z-20 mt-4 shadow-[0px_10px_30px_rgba(0,0,0,0.3)] custom-3d-tilt" />

                        
                        {/* Blob positioned behind the image */}
                        <div className="absolute inset-0 flex justify-center items-center z-0">
                            <SvgBlob
                            variant="gradient"
                            colors={["#0de046", "#03631d"]}
                            color="#00cec9"
                            shapeProps={generateShapeProps()}
                            isOutline={false} // Ensure `isOutline` is set to `false` if you don't want an outline
                            className="w-[130%] h-auto" // Adjust size as needed
                            />
                        </div>
                    
                    </div>

                    <div className="flex md:w-1/2 flex-col mt-32 md:mt-0 ">
                        <h1 className="text-center md:text-left text-black dark:text-white font-RobotoBold text-4xl md:text-6xl">
                            Set your own price.
                        </h1>
                        <p className="text-center md:text-left text-black dark:text-white font-RobotoRegular text-md md:text-lg mt-6 lg:mt-4">
                            Payments are handled between you and the driver.
                        </p>
                    </div>
                </div>

                <div className="flex mb-32 bg-white dark:bg-[#0c0c0c] lg:mt-32 flex-col lg:space-x-8 px-4 lg:px-6 lg:flex-row items-center justify-center w-screen md:max-w-screen-lg">
                    <div className="flex md:w-1/2 flex-col spac ">
                        <h1 className="text-center md:text-left text-black dark:text-white font-RobotoBold text-4xl md:text-6xl">
                            Carpool with other gators.
                        </h1>
                        <p className="text-center md:text-left text-black dark:text-white font-RobotoRegular text-md md:text-lg mt-6 lg:mt-4">
                            Enable carpooling to save money and reduce carbon emissions.
                        </p>
                    </div>

                    <div className="relative md:w-1/2 justify-center items-center mt-32 lg:mt-0 px- lg:px-0 flex flex-col">
                        {/* Blob positioned behind the image */}
                        <div className="absolute inset-0 flex justify-center items-center z-0">
                            <SvgBlob
                            variant="gradient"
                            colors={["#0de046", "#03631d"]}
                            color="#00cec9"
                            shapeProps={generateShapeProps()}
                            isOutline={false} // Ensure `isOutline` is set to `false` if you don't want an outline
                            className="w-[130%] h-auto" // Adjust size as needed
                            />
                        </div>
                        
                        {/* Image positioned above the blob */}
                        <img src={home_blob_3}
                        className="relative w-full rounded-xl z-20 mt-4 shadow-[0px_10px_30px_rgba(0,0,0,0.3)] custom-3d-tilt" />

                    </div>
                </div>

            </div>

            <Footer />
        </div>
    );
};

export default HomePage;
