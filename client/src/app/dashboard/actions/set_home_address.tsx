import React, { useState, useEffect } from 'react'
import {
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Button,
    useDisclosure,
    Input,
} from "@heroui/react";
import { StatusCard, AccountData } from '../../view_controller';
import fetchBase from '../../../common/fetchBase';

interface SetHomeAddressProps {
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
    statusCard: StatusCard;
    onClose: () => void;
}

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibXVzdGFmYW1hc29keSIsImEiOiJjbTZva3FneTIwZjI5MmxvdWQ1dHY1NTlwIn0.oNPGEBsenNviLdx_qzcPWw';

const SetHomeAddress: React.FC<SetHomeAddressProps> = ({ statusCard, onClose, setAccountData }) => {

    const [address, setAddress] = useState<string>("");
    const [addressLine1, setAddressLine1] = useState<string>("");
    const [addressLine2, setAddressLine2] = useState<string>("");
    const [city, setCity] = useState<string>("");
    const [state, setState] = useState<string>("");
    const [zip, setZip] = useState<string>("");
    const [searchResults, setSearchResults] = useState<any>([]);
    const [latitude, setLatitude] = useState<number>(0);
    const [longitude, setLongitude] = useState<number>(0);

    const [loadingSave, setLoadingSave] = useState<boolean>(false);

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

    return (
        <>
                <>
                <DrawerHeader className="flex flex-col gap-1 text-black dark:text-white">
                    <h1 className="text-2xl font-RobotoSemiBold">{statusCard.title}</h1>
                    <p className="text-sm font-RobotoLight">
                        Set your home address to book rides and request rides easier. Your address will be kept private unless you share it with a driver. It is held securely and encrypted in our database.
                    </p>
                </DrawerHeader>

                <DrawerBody>
                    <div className="relative">
                        <Input
                            placeholder="Start typing address..."
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                                searchAddress(e.target.value);
                            }}
                            className="light dark:dark rounded-full mt-3 "
                            radius="full"
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute z-50 w-full text-black dark:text-white max-h-96 overflow-y-scroll bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-2xl shadow-lg mt-1">
                                {searchResults.map((place, index) => (
                                    <div
                                        key={index}
                                        className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700"
                                        onClick={() => {
                                            setAddress(place.place_name);
                                            setAddressLine1(place.address);
                                            setCity(place.context.find((c: any) => c.id.includes('place')).text);
                                            setState(place.context.find((c: any) => c.id.includes('region')).text);
                                            setZip(place.context.find((c: any) => c.id.includes('postcode')).text);
                                            setLatitude(place.center[1]);
                                            setLongitude(place.center[0]);
                                            setSearchResults([]);
                                        }}
                                    >
                                        {place.place_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="text-sm ml-3 font-RobotoLight text-gray-700 dark:text-gray-300">
                        These results are powered by Mapbox. 
                    </p>

                    <Input
                            placeholder="Apartment, unit number, etc."
                            value={addressLine2}
                            onChange={(e) => {
                                setAddressLine2(e.target.value);
                            }}
                            className="light dark:dark rounded-full mt-3 "
                            radius="full"
                        />
                </DrawerBody>
                <DrawerFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                    Close
                    </Button>
                    <Button
                    isLoading={loadingSave}
                    color="primary" onPress={() => {
                        setLoadingSave(true);
                        fetch(fetchBase + "/v1/rider/address/save", {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
                                'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username')
                            },
                            body: JSON.stringify({
                                address: address,
                                address_line1: addressLine1,
                                address_line2: addressLine2,
                                city: city,
                                state: state,
                                zip: zip,
                                latitude: latitude,
                                longitude: longitude
                            })
                        }).then(res => res.json()).then(data => {
                            setLoadingSave(false);
                            if(data.success) {
                                onClose();
                                 
                                setAccountData((prev) => {
                                    return {
                                        ...prev,
                                        status_cards: prev.status_cards.filter(card => card.uuid !== statusCard.uuid)
                                    }
                                });
                            }
                        }).catch(err => {
                            setLoadingSave(false);
                            console.error("Error saving address:", err);
                        })
                    }}>
                    Save Address
                    </Button>
                </DrawerFooter>
                </>
        </>
    );
}

export default SetHomeAddress