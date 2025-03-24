import { WaypointEntity } from "./waypoint";

export interface RiderQueryEntity {
    query_uuid: string;
    from: WaypointEntity;
    to: WaypointEntity;
    date: Date;
    lastQueried: Date;
}
