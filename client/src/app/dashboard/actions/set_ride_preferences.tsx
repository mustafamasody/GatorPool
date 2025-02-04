import React, { useState, useEffect } from 'react'
import {
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Button,
    useDisclosure,
    Input,
    RadioGroup,
    Radio,
} from "@heroui/react";
import { StatusCard, AccountData } from '../../view_controller';
import fetchBase from '../../../common/fetchBase';

interface SetRidePreferencesProps {
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
    statusCard: StatusCard;
    onClose: () => void;
}

const SetRidePreferences: React.FC<SetRidePreferencesProps> = ({ statusCard, onClose, setAccountData }) => {
    
    const [loadingSave, setLoadingSave] = useState<boolean>(false);

    const [selectedFood, setSelectedFood] = React.useState("Yes");
    const [selectedGas, setSelectedGas] = React.useState("Yes");
    
    return (
        <>
            <DrawerHeader className="flex flex-col gap-1 text-black dark:text-white">
                <h1 className="text-2xl font-RobotoSemiBold">{statusCard.title}</h1>
                <p className="text-sm font-RobotoLight">
                    Set your ride preferences to help drivers know what you are willing to pay for. This will help drivers know what you are willing to pay for and what you are not willing to pay for.
                </p>
            </DrawerHeader>

            <DrawerBody>

            <RadioGroup label="Willing to pay for food" value={selectedFood} onValueChange={setSelectedFood}>
                <Radio value="Yes">Yes</Radio>
                <Radio value="No">No</Radio>
            </RadioGroup>
            <p className="text-default-500 text-small">Selected: {selectedFood}</p>

            <RadioGroup className="mt-4" label="Willing to pay for gas" value={selectedGas} onValueChange={setSelectedGas}>
                <Radio value="Yes">Yes</Radio>
                <Radio value="No">No</Radio>
            </RadioGroup>
            <p className="text-default-500 text-small">Selected: {selectedGas}</p>

            </DrawerBody>

            <DrawerFooter className="flex flex-col">
                <p className="text-default-500 text-small">
                    Note: These preferences can be changed when requesting or booking a ride. This is just a default preference to book and request trips faster.
                </p>
                <div className="flex flex-row gap-2 ml-auto">
                <Button color="danger" variant="light" onPress={onClose}>
                    Close
                </Button>
                <Button
                isLoading={loadingSave}
                color="primary" onPress={() => {
                    setLoadingSave(true);
                    fetch(fetchBase + "/v1/rider/preferences/save", {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
                            'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username')
                        },
                        body: JSON.stringify({
                            pay_for_food: selectedFood === "Yes",
                            pay_for_gas: selectedGas === "Yes"
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
                </div>
            </DrawerFooter>
        </>
    );
}

export default SetRidePreferences