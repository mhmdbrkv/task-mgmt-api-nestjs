-- Add partial unique constraint to ensure only one owner per project
CREATE UNIQUE INDEX "one_owner_per_project"
ON "ProjectMembership" ("projectId")
WHERE "role" = 'OWNER';

-- Add partial unique constraint to ensure only one pending invitation per user per project
CREATE UNIQUE INDEX "one_pending_invitation_per_user_project"
ON "Invitation" ("inviteeId", "projectId")
WHERE "status" = 'PENDING';