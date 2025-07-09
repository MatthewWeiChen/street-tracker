/**
 * PURPOSE: Central export file for all GraphQL types
 * - Exports all GraphQL types and resolvers from individual files
 * - Makes it easy to import everything with a single import statement
 * - Keeps the main schema file clean and organized
 */

// Export all user-related types and resolvers
export * from "./User";

// Export all evangelism contact types and resolvers
export * from "./EvangelismContact";

// Export all student record types and resolvers
export * from "./StudentRecord";

// Export all region and group types and resolvers
export * from "./Region";

// Add more exports here as you create new type files
