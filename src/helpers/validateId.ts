
/**
 * @helper isValidId
 * @description Boolean check to verify if a string is a valid MongoDB ObjectId.
 * Essential for preventing 'CastError' during database lookups.
 */

import mongoose from "mongoose";

export const isValidId = (id: string | null) => 
    id && mongoose.Types.ObjectId.isValid(id);