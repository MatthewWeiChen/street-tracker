/**
 * PURPOSE: Student record management GraphQL types and resolvers
 * - Tracks ongoing discipleship and teaching activities
 * - Manages lesson progress and scheduling
 * - Implements same hierarchical permissions as evangelism contacts
 * - Provides CRUD operations with proper authorization
 */

import {
  objectType,
  extendType,
  nonNull,
  stringArg,
  arg,
  booleanArg,
} from "nexus";

// GraphQL type for student records
// Represents people being discipled or taught in ongoing lessons
export const StudentRecord = objectType({
  name: "StudentRecord",
  definition(t) {
    // Student identification and progress tracking
    t.nonNull.string("id");
    t.nonNull.string("studentName"); // Student's name
    t.string("lastLesson"); // What was covered in last lesson
    t.field("lastLessonDate", { type: "DateTime" }); // When last lesson occurred
    t.field("nextLessonDate", { type: "DateTime" }); // When next lesson is scheduled
    t.string("notes"); // Progress notes, prayer requests, etc.
    t.nonNull.boolean("isActive"); // Is this student still being taught?
    t.nonNull.field("createdAt", { type: "DateTime" });
    t.nonNull.field("updatedAt", { type: "DateTime" });

    // Reference to the user who is teaching/tracking this student
    // Important for determining data visibility permissions
    t.nonNull.field("tracker", {
      type: "User",
      resolve: (parent, _, context) => {
        return context.prisma.user.findUniqueOrThrow({
          where: { id: parent.trackerId },
        });
      },
    });
  },
});

// Query to get student records with role-based filtering
export const StudentRecordQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("studentRecords", {
      type: "StudentRecord",
      resolve: async (_, __, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }

        // Get student records based on user role and hierarchy
        // Same permission structure as evangelism contacts
        const records = await getStudentRecordsForUser(
          context.currentUser,
          context.prisma
        );
        return records;
      },
    });
  },
});

// Mutations for creating and updating student records
export const StudentRecordMutation = extendType({
  type: "Mutation",
  definition(t) {
    // Create a new student record
    t.field("createStudentRecord", {
      type: "StudentRecord",
      args: {
        studentName: nonNull(stringArg()), // Required: student's name
        lastLesson: stringArg(), // Optional: last lesson covered
        lastLessonDate: arg({ type: "DateTime" }), // Optional: when last lesson was
        nextLessonDate: arg({ type: "DateTime" }), // Optional: when next lesson is
        notes: stringArg(), // Optional: progress notes
      },
      resolve: (_, args, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }

        // Create student record and link it to the current user as tracker
        return context.prisma.studentRecord.create({
          data: {
            ...args,
            trackerId: context.currentUser.id,
          },
        });
      },
    });

    // Update an existing student record
    t.field("updateStudentRecord", {
      type: "StudentRecord",
      args: {
        id: nonNull(stringArg()), // Required: record ID
        studentName: stringArg(), // Optional updates
        lastLesson: stringArg(),
        lastLessonDate: arg({ type: "DateTime" }),
        nextLessonDate: arg({ type: "DateTime" }),
        notes: stringArg(),
        isActive: booleanArg(), // Mark as active/inactive
      },
      resolve: async (_, { id, ...args }, context) => {
        if (!context.currentUser) {
          throw new Error("Not authenticated");
        }

        // Check if user has permission to update this record
        const record = await context.prisma.studentRecord.findUnique({
          where: { id },
          include: { tracker: true },
        });

        if (!record) {
          throw new Error("Student record not found");
        }

        // Verify user has permission to modify this student record
        const hasPermission = await canUserModifyStudentRecord(
          context.currentUser,
          record,
          context.prisma
        );
        if (!hasPermission) {
          throw new Error("Not authorized to modify this student record");
        }

        return context.prisma.studentRecord.update({
          where: { id },
          data: args,
        });
      },
    });
  },
});

/**
 * HELPER FUNCTION: Get student records based on user role and hierarchy
 * Same permission structure as evangelism contacts:
 * - Directors: See all student records from everyone
 * - Region Leaders: See records from all users in their region
 * - Group Leaders: See records from all users in their group
 * - Group Members: See only their own student records
 */
async function getStudentRecordsForUser(user: any, prisma: any) {
  switch (user.role) {
    case "DIRECTOR":
      // Directors see all student records
      return prisma.studentRecord.findMany({
        include: { tracker: true },
        orderBy: { updatedAt: "desc" },
      });

    case "REGION_LEADER":
      // Get all student records from users in this region
      const regionProfile = await prisma.regionLeaderProfile.findUnique({
        where: { userId: user.id },
        include: { region: { include: { groups: true } } },
      });

      if (!regionProfile) return [];

      // Find all groups in this region
      const groupIds = regionProfile.region.groups.map((g: any) => g.id);

      // Find all users in these groups
      const userIds = await prisma.user.findMany({
        where: {
          OR: [
            { groupLeaderProfile: { groupId: { in: groupIds } } },
            { groupMemberProfile: { groupId: { in: groupIds } } },
          ],
        },
        select: { id: true },
      });

      // Return records from region leader and all users in their region
      return prisma.studentRecord.findMany({
        where: {
          trackerId: { in: [user.id, ...userIds.map((u: any) => u.id)] },
        },
        include: { tracker: true },
        orderBy: { updatedAt: "desc" },
      });

    case "GROUP_LEADER":
      // Get all student records from users in this group
      const groupProfile = await prisma.groupLeaderProfile.findUnique({
        where: { userId: user.id },
      });

      if (!groupProfile) return [];

      // Find all group members
      const groupMemberIds = await prisma.groupMemberProfile.findMany({
        where: { groupId: groupProfile.groupId },
        select: { userId: true },
      });

      // Return records from group leader and all group members
      return prisma.studentRecord.findMany({
        where: {
          trackerId: {
            in: [user.id, ...groupMemberIds.map((m: any) => m.userId)],
          },
        },
        include: { tracker: true },
        orderBy: { updatedAt: "desc" },
      });

    case "GROUP_MEMBER":
      // Only see own student records
      return prisma.studentRecord.findMany({
        where: { trackerId: user.id },
        include: { tracker: true },
        orderBy: { updatedAt: "desc" },
      });

    default:
      return [];
  }
}

/**
 * HELPER FUNCTION: Check if user can modify a specific student record
 * Same authorization rules as evangelism contacts:
 * - Users can always modify their own records
 * - Directors can modify any record
 * - Region Leaders can modify records from their region
 * - Group Leaders can modify records from their group members
 */
async function canUserModifyStudentRecord(user: any, record: any, prisma: any) {
  // Users can always modify their own records
  if (record.trackerId === user.id) return true;

  // Directors can modify any record
  if (user.role === "DIRECTOR") return true;

  // Region leaders can modify records from their region
  if (user.role === "REGION_LEADER") {
    const regionProfile = await prisma.regionLeaderProfile.findUnique({
      where: { userId: user.id },
      include: { region: { include: { groups: true } } },
    });

    if (!regionProfile) return false;

    const groupIds = regionProfile.region.groups.map((g: any) => g.id);
    const recordTrackerGroup = await prisma.user.findUnique({
      where: { id: record.trackerId },
      include: {
        groupLeaderProfile: true,
        groupMemberProfile: true,
      },
    });

    if (!recordTrackerGroup) return false;

    const trackerGroupId =
      recordTrackerGroup.groupLeaderProfile?.groupId ||
      recordTrackerGroup.groupMemberProfile?.groupId;

    return trackerGroupId && groupIds.includes(trackerGroupId);
  }

  // Group leaders can modify records from their group members
  if (user.role === "GROUP_LEADER") {
    const groupProfile = await prisma.groupLeaderProfile.findUnique({
      where: { userId: user.id },
    });

    if (!groupProfile) return false;

    const recordTrackerProfile = await prisma.groupMemberProfile.findUnique({
      where: { userId: record.trackerId },
    });

    return recordTrackerProfile?.groupId === groupProfile.groupId;
  }

  return false;
}
