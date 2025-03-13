export interface DriverApplicationEntity {
    application_uuid?: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
    date_of_birth?: string;
    address?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    accepted?: boolean;
    accepted_at?: Date;
    message?: string;
    closed?: boolean;
    created_at?: Date;
    updated_at?: Date;
    vehicle?: VehicleEntity;
}

interface VehicleEntity {
    vehicle_uuid?: string;
    make?: string;
    model?: string;
    year?: string;
    color?: string;
    license_plate?: string;
    state?: string;
    seats?: number;
    lugroom?: number;
    created_at?: Date;
}

export interface CreateTripDriverFlowOptionsEntity {
    to?: {
        text: string;
        lat: number;
        lng: number;
        expected: number;
    };
    from?: {
        text: string;
        lat: number;
        lng: number;
        expected: number;
    };
    datetime?: string;
    radius?: number;
    fare?: { // 2
        trip: number;
        gas: number;
        food: number;
        accepted_terms: boolean;
    };
    music_preferences?: { // 2
        can_be_controlled: boolean;
        requests: Record<string, string>;
    };
    ac_preferences?: { // 2
        can_be_controlled: boolean;
        requests: Record<string, string>;
    };
    talking_preferences?: { // 2
        silent: boolean;
        minimal: boolean;
        requests: Record<string, string>;
    };
    rider_requirements?: { // 2
        pay_food: boolean;
        pay_gas: boolean;
        females_only: boolean;
        custom: Record<string, string>;
    };
    carpool?: boolean;
}