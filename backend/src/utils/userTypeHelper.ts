import { UserType } from "@prisma/client";

/**
 * Helper function to check if a user has a specific user type
 * @param userTypes - The user's user_type array (or single value for backward compatibility)
 * @param type - The type to check for
 * @returns true if the user has the specified type
 */
export function hasUserType(userTypes: UserType | UserType[] | null | undefined, type: UserType): boolean {
  if (!userTypes) {
    return false;
  }
  
  // Handle both array and single value (for backward compatibility during migration)
  const typesArray = Array.isArray(userTypes) ? userTypes : [userTypes];
  return typesArray.includes(type);
}

/**
 * Helper function to check if a user is a creator
 */
export function isCreator(userTypes: UserType | UserType[] | null | undefined): boolean {
  return hasUserType(userTypes, UserType.CREATOR);
}

/**
 * Helper function to check if a user is a regular user
 */
export function isUser(userTypes: UserType | UserType[] | null | undefined): boolean {
  return hasUserType(userTypes, UserType.USER);
}

/**
 * Helper function to check if a user is an admin
 */
export function isAdmin(userTypes: UserType | UserType[] | null | undefined): boolean {
  return hasUserType(userTypes, UserType.ADMIN);
}

