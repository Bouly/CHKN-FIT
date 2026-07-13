// Miroir des DTOs du backend

export interface UserDto {
  id: number;
  email: string;
  displayName: string;
  avatarEmoji: string;
  role: "ADMIN" | "MEMBER";
  followTeamPlan: boolean;
  heightCm: number | null;
  birthDate: string | null;
  goal: string | null;
  trainingDays: string[];
  rotation: string[];
}

export interface TeamSettingsDto {
  trainingDays: string[];
  rotation: string[];
}

export interface TeamWeekStatsDto {
  totalVolumeKg: number;
  totalSessions: number;
  totalSets: number;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface ExerciseDto {
  id: number;
  name: string;
  muscleGroup: string;
  muscleGroupLabel: string;
  type: string;
  description: string | null;
  builtin: boolean;
}

export interface TemplateExerciseDto {
  id: number;
  exercise: ExerciseDto;
  sets: number;
  targetReps: string;
  restSeconds: number;
}

export interface TemplateDto {
  id: number;
  name: string;
  focus: string;
  focusLabel: string;
  focusEmoji: string;
  description: string | null;
  builtin: boolean;
  exercises: TemplateExerciseDto[];
}

export interface SessionSummaryDto {
  id: number;
  focus: string;
  focusLabel: string;
  focusEmoji: string;
  status: string;
  setCount: number;
  durationMin: number | null;
  rpe: number | null;
}

export interface PlanDayDto {
  date: string;
  trainingDay: boolean;
  holiday: boolean;
  holidayName: string | null;
  session: SessionSummaryDto | null;
}

export interface TeamTodayDto {
  userId: number;
  displayName: string;
  avatarEmoji: string;
  status: string;
  focus: string | null;
  focusEmoji: string | null;
}

export interface SetDto {
  id: number;
  exerciseId: number;
  exerciseName: string;
  exerciseType: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
  distanceM: number | null;
  e1rm: number | null;
  pr: boolean;
}

export interface ExerciseBestDto {
  bestE1rm: number | null;
  bestWeightKg: number | null;
  bestReps: number | null;
  lastWeightKg: number | null;
  lastReps: number | null;
  suggestedWeightKg: number | null;
}

export interface SessionDetailDto {
  id: number;
  date: string;
  focus: string;
  focusLabel: string;
  focusEmoji: string;
  status: string;
  notes: string | null;
  durationMin: number | null;
  rpe: number | null;
  sets: SetDto[];
  suggestedTemplate: TemplateDto | null;
  bests: Record<number, ExerciseBestDto>;
}

export interface PrDto {
  exerciseId: number;
  exerciseName: string;
  weightKg: number | null;
  reps: number | null;
  e1rm: number;
  date: string;
}

export interface DashboardDto {
  streak: number;
  totalCompleted: number;
  attendanceRate30d: number;
  todaySession: SessionSummaryDto | null;
  todayDate: string;
  todayIsHoliday: boolean;
  todayHolidayName: string | null;
  nextTrainingDate: string | null;
  recentPrs: PrDto[];
  currentWeightKg: number | null;
  weightDelta30d: number | null;
  photoCount: number;
  weekCompletedCount: number;
  weekPlannedCount: number;
}

export interface ExercisePointDto {
  date: string;
  bestE1rm: number | null;
  topWeight: number | null;
  volume: number | null;
}

export interface VolumePointDto {
  weekStart: string;
  volume: number;
  sessions: number;
}

export interface MeasurementDto {
  id: number;
  date: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  bicepCm: number | null;
  thighCm: number | null;
  notes: string | null;
}

export interface PhotoDto {
  id: number;
  takenAt: string;
  angle: string;
  angleLabel: string;
  weightKg: number | null;
}

export interface LeaderboardEntryDto {
  rank: number;
  userId: number;
  displayName: string;
  avatarEmoji: string;
  points: number;
  sessions: number;
  streak: number;
  prs: number;
  photos: number;
}

export interface BadgeDto {
  code: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
}

export interface MemberDto {
  userId: number;
  displayName: string;
  avatarEmoji: string;
  role: "ADMIN" | "MEMBER";
  followTeamPlan: boolean;
  streak: number;
  totalSessions: number;
  goal: string | null;
  badges: BadgeDto[];
}

export interface FeedItemDto {
  date: string;
  userName: string;
  avatarEmoji: string;
  text: string;
  emoji: string;
}

export const FOCUS_OPTIONS = [
  { value: "CHEST", label: "Pecs", emoji: "🏋️" },
  { value: "BACK", label: "Dos", emoji: "🧗" },
  { value: "SHOULDERS", label: "Épaules", emoji: "🎯" },
  { value: "ARMS", label: "Bras", emoji: "💪" },
  { value: "LEGS", label: "Jambes", emoji: "🦵" },
  { value: "PUSH", label: "Push", emoji: "🏋️" },
  { value: "PULL", label: "Pull", emoji: "🧗" },
  { value: "FULL_BODY", label: "Full Body", emoji: "💪" },
  { value: "CARDIO", label: "Cardio", emoji: "🏃" },
  { value: "HIIT", label: "HIIT", emoji: "🔥" },
  { value: "MOBILITY", label: "Mobilité", emoji: "🧘" },
] as const;

export const DAY_OPTIONS = [
  { value: "MONDAY", label: "Lundi", short: "Lun" },
  { value: "TUESDAY", label: "Mardi", short: "Mar" },
  { value: "WEDNESDAY", label: "Mercredi", short: "Mer" },
  { value: "THURSDAY", label: "Jeudi", short: "Jeu" },
  { value: "FRIDAY", label: "Vendredi", short: "Ven" },
  { value: "SATURDAY", label: "Samedi", short: "Sam" },
  { value: "SUNDAY", label: "Dimanche", short: "Dim" },
] as const;
