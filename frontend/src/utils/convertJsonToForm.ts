export const convertJsonToForm = (json: any) => {
    const formData = new FormData();
    
    Object.keys(json).forEach(key => {
        const value = json[key];
        
        // Skip empty, null, undefined values
        if (!value || value === '' || value === null || value === undefined) {
            return;
        }
        
        // Handle File objects and other values
        if (value instanceof File) {
            formData.append(key, value);
        } else if (Array.isArray(value)) {
            // Handle arrays (like members)
            formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
            // Handle boolean values
            formData.append(key, value.toString());
        } else if (typeof value === 'number') {
            // Handle number values
            formData.append(key, value.toString());
        } else {
            // Handle string values
            formData.append(key, value);
        }
    });

    return formData;
}