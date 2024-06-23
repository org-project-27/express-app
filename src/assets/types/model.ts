export interface DefaultModelClass {
    model: any,
    methods: any,
    includes: any,
    requiredFields: any,
}

export type PlaceListDataType = {
    name: string,
    type: number,
    address: string,
    city: string,
    state: string,
    zip_code: string,
    phone: string,
    website: string,
    opening_hours: string,
}