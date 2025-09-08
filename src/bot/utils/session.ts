export type AppointmentFlowStep =
  | 'awaiting_name'
  | 'awaiting_phone'
  | 'awaiting_service'
  | 'awaiting_day'
  | 'awaiting_slot'
  | 'awaiting_confirmation'
  | null;

export interface SessionState {
  step: AppointmentFlowStep;
  name?: string;
  phone?: string;
  selectedServiceId?: number;
  selectedDayIso?: string;
  selectedSlot?: {
    startDate: Date;
    endDate: Date;
  };
}

const userSelections: Record<number, SessionState> = {};

export const getUserSession = (userId: number): SessionState => {
  if (!userSelections[userId]) {
    userSelections[userId] = { step: null };
  }
  return userSelections[userId];
};

export const clearUserSession = (userId: number) => {
  delete userSelections[userId];
};
