/**
 * DATABASE MIGRATION SCRIPT: USER AVATAR System
 * ---------------------------------------------
 * Purpose:
 * This script updates existing user documents to support the new initials-based avatar system.
 * It ensures every user has a valid 'avatarType' and 'avatarInitials' based on their current
 * profile.
 * * Run manually: node scripts/migrate-avatars.js (after building)
 */
import dotenv from "dotenv";
// Load environment variables from .env.local for database connection
dotenv.config({ path: ".env.local" });

import dbConnect from "../src/lib/dbConnect";
import { UserModel } from "../src/model/index";
import { getInitials } from "../src/utils/profile/profile.utils";

async function migrageUserAvatar(){
    // Ensure we are connected to the Mongo instance.
    await dbConnect();

    /** *QUERY OPTIMIZATION:
     * We only fetch users who are missing the new fields.
     * This prevents unnecessary database writers for already migrated users.
     */
    const users = await UserModel.find({
        $or: [
            { avatarInitials: { $exists: false }},
            { avatarType: { $exists: false }},
        ]
    });

    for(const user of users){
        // Generate 2-letter initials
        const initials = getInitials(user.username);

        /**
         * LOGIC:
         * If the user has a custom image URL, use 'image' type.
         * Otherwise, default to the 'initial' type for the UI fallback.
         */
        user.avatarInitials = initials;
        user.avatarType = user.avatarUrl ? "image" : "initial";

        // Persist the changes to the database
        await user.save();

    }

    process.exit(0);
}

// Error handling for the migration process
migrageUserAvatar().catch(error => {
    process.exit(1);
});