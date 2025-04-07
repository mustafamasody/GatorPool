import React from 'react';
import { AccountData } from '../../view_controller';

interface RiderFlowRequestProps {
    accountData: AccountData;
    setAccountData: React.Dispatch<React.SetStateAction<AccountData>>;
}

const RiderFlowRequest = ({ accountData, setAccountData }: RiderFlowRequestProps) => {
    return (
        <div>rider_flow_request</div>
    )
}

export default RiderFlowRequest