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

interface Enable2FAProps {
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
    statusCard: StatusCard;
    onClose: () => void;
}

const Enable2FA: React.FC<Enable2FAProps> = ({ statusCard, onClose, setAccountData }) => {
    
    const [loadingSave, setLoadingSave] = useState<boolean>(false);

    return (
        <>
            <DrawerHeader className="flex flex-col gap-1 text-black dark:text-white">
                <h1 className="text-2xl font-RobotoSemiBold">{statusCard.title}</h1>
                <p className="text-sm font-RobotoLight">
                    Enable Two-Factor Authentication to secure your account. This will help protect your account from unauthorized access and keep your account secure.
                </p>
            </DrawerHeader>

            <DrawerFooter className="flex flex-col">
                <div className="flex flex-row gap-2 ml-auto">
                <Button color="danger" variant="light" onPress={onClose}>
                    Close
                </Button>
                <Button
                isLoading={loadingSave}
                color="primary" onPress={() => {
                    setLoadingSave(true);
                    fetch(fetchBase + "/v1/account/auth/2fa", {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-GatorPool-Device-Id': localStorage.getItem('X-GatorPool-Device-Id'),
                            'X-GatorPool-Username': localStorage.getItem('X-GatorPool-Username')
                        },
                        body: JSON.stringify({
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

export default Enable2FA