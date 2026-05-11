$conn = "postgresql://neondb_owner:npg_xTMlabWG8FB0@ep-snowy-wildflower-acounu23.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

$tables = @(
    "Secretary",
    "Subject",
    "Teacher",
    "Availability",
    "TeacherSubject",
    "ExamSchedule",
    "RecoverySchedule",
    "Appointment",
    "ExamBooking",
    "RecoveryBooking"
)

foreach ($table in $tables) {
    Write-Host "Restaurando $table..." -ForegroundColor Cyan
    pg_restore --data-only --no-acl --no-owner -t $table -d $conn recovery.dump
    Write-Host "OK: $table" -ForegroundColor Green
}