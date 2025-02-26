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
