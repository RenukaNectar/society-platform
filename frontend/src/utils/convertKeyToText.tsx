export const convertKeyToText = (key: string): string => {
    if (!key) return "";
  
    return key
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/^./, (str) => str.toUpperCase());
  };
  