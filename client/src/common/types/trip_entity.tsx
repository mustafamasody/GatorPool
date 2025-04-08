export interface TripEntity {
	trip_uuid?: string;
	waypoints?: WaypointEntity[];
	assigned_driver?: TripAssignedDriverEntity;
	driver_requests?: TripDriverRequestEntity[];
	posted_by?: string;
	posted_by_type?: string;
	flow_type?: string;
	carpool?: boolean;
	datetime?: string;
	current_location?: WaypointEntity;
	riders?: TripRiderEntity[];
	rider_requirements?: TripRiderRequirementsEntity;
	status?: string;
	fare?: TripFareEntity;
	conflicts?: TripConflictEntity[];
	miscellaneous?: TripMiscellaneousEntity;
	max_radius_dropoff?: number;
	created_at?: string;
	updated_at?: string;
}

export interface TripConflictEntity {
	type?: string;
	conflict_at?: string;
	old_values?: Record<string, any>;
	changed_values?: Record<string, any>;
}

export interface TripFareEntity {
	aggregated?: number;
	gas?: number;
	trip?: number;
	food?: number;
}

export interface TripMiscellaneousEntity {
	music?: TripMiscellaneousMusicOptionsEntity;
	ac?: TripMiscellaneousACOptionsEntity;
	talking?: TripMiscellaneousTalkingOptionsEntity;
}

export interface TripMiscellaneousMusicOptionsEntity {
	can_be_controlled?: boolean;
	requests?: Record<string, any>;
}

export interface TripMiscellaneousACOptionsEntity {
	can_be_controlled?: boolean;
	requests?: Record<string, any>;
}

export interface TripMiscellaneousTalkingOptionsEntity {
	can_be_controlled?: boolean;
	type?: string;
	requests?: Record<string, any>;
}

export interface TripDriverRequestEntity {
	user_uuid?: string;
	address?: WaypointEntity;
	requested_at?: string;
	fare?: TripFareEntity;
}

export interface TripAssignedDriverEntity {
	user_uuid?: string;
	address?: WaypointEntity;
	gender?: string;
	assigned_at?: string;
}

export interface TripRiderEntity {
	user_uuid?: string;
	address?: WaypointEntity;
	accepted?: boolean;
	accepted_at?: string;
	rating?: number;
	review?: string;
	willing?: TripRiderWillingEntity;
	created_at?: string;
}

export interface TripRiderWillingEntity {
	pay_food?: boolean;
	pay_gas?: boolean;
	custom?: Record<string, any>;
}

export interface TripRiderRequirementsEntity {
	females_only?: boolean;
	pay_food?: boolean;
	pay_gas?: boolean;
	custom?: Record<string, any>;
}

export interface WaypointEntity {
	type?: string;
	for?: string;
	data?: Record<string, any>;
	latitude?: number;
	longitude?: number;
	name?: string;
	address?: string;
	address2?: string;
	city?: string;
	state?: string;
	zip?: string;
	geo_text?: string;
	expected?: string;
	actual?: string;
}