import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { AccountData } from '../../view_controller';

interface RiderFlowCreatedTripProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const RiderFlowCreatedTrip = ({ accountData, setAccountData }: RiderFlowCreatedTripProps) => {
    const { trip_uuid } = useParams();

    return (
        <div>created</div>
    )
}

export default RiderFlowCreatedTrip;