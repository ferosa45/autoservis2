-- Add indexes for frequently queried foreign keys and scoped invoice status lookups.
CREATE INDEX "Vehicle_customerId_idx" ON "Vehicle"("customerId");
CREATE INDEX "Job_customerId_idx" ON "Job"("customerId");
CREATE INDEX "Job_vehicleId_idx" ON "Job"("vehicleId");
CREATE INDEX "Job_assignedUserId_idx" ON "Job"("assignedUserId");
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE INDEX "Invoice_garageId_status_idx" ON "Invoice"("garageId", "status");
CREATE INDEX "Task_jobId_idx" ON "Task"("jobId");
