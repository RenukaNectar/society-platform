export const formatPermissions = (permissions: { resource: string; action: string }[]) => {
    const result: Record<string, boolean> = {};

    for (const { resource, action } of permissions) {
        const actionKey = formatWord(action);
        const resourceKey = formatWord(resource);

        const key = `can${capitalize(actionKey)}${capitalize(resourceKey)}`;
        result[key] = true;
    }

    return result;
}

const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const formatWord = (word: string): string => {
    return word?.split(/[_-]/).map(word => capitalize(word)).join('');
}