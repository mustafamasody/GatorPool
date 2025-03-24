
export interface WaypointEntity {
    type?: string;
    for?: string;
    data?: any;
    latitude?: number;
    longitude?: number;
    name?: string;
    address?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    geo_text?: string;
    expected?: Date;
    actual?: Date;
}