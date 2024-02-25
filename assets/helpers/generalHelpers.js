export function deepCopy(model){
    return JSON.parse(JSON.stringify(model));
}

export function trimObjectValues(object = {}){
    Object.keys(object).forEach(key => {
        if(object[key]){
            object[key] = object[key]?.trim();
        } else {
            object[key] = null;
        }
    });
    return object;
}