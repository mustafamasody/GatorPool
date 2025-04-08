export interface VehicleEntity {
    make: string;
    model: string;
    year: string;
    color: string;
    license_plate: string;
    state: string;
    seats: number;
    lugroom: number;
}

export interface DriverProfile {
    first_name: string;
    last_name: string;
    profile_picture: string;
    phone: string;
    email: string;
    gender: string;
    rating: number;
    vehicle: VehicleEntity;
    trip_uuid: string;
    user_uuid: string;
}