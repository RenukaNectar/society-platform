
import SocietyRegistration from "../models/SocietyRegistration";
// Utility to generate NCDID
    export const generateNcdId = async (state_code: number, sector_of_operation: number) => {
    // 1. Get last used number (you may store in DB table or check from registrations)
    const lastSociety = await SocietyRegistration.findOne({
      order: [['created_at', 'DESC']], // or by a sequence column if you have one
      attributes: ['ncd_id'],
      raw: true
    });
  
    let lastNumber = 1200000; // default base
    if (lastSociety?.ncd_id) {
        console.log('lastSociety', lastSociety)
      // Take last 7 digits
      const match = lastSociety.ncd_id.match(/(\d{7})$/);
      if (match && typeof match[1] === 'string') {
        console.log('match', match)
        lastNumber = parseInt(match[1], 10);
      }
    }
      let newNumber = lastNumber + 1;
  
    // 2. Format state code (2 digits)
    const formattedState = state_code <= 9 ? `${state_code}` : `${state_code}`;
  
    // 3. Format sector (3 digits)
    const formattedSector = sector_of_operation.toString().padStart(3, '0');
  
    // 4. Format number (7 digits)
    const formattedNumber = newNumber.toString().padStart(7, '0');
  
    // 5. Concatenate
    const ncdId = `C${formattedState}${formattedSector}${formattedNumber}`;
  
    return { ncdId, newNumber };
  };