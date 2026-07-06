export type EngineerRole = "admin" | "engineer";

export interface Engineer {
  id: string;
  email: string;
  name: string;
  role: EngineerRole;
  active: boolean;
  created_at: string;
}

export interface Floor {
  id: string;
  name: string;
  created_at: string;
}

export type TicketStatus = "Open" | "In Progress" | "Done" | "On Hold" | "Cancelled";
export type TicketPriority = "Low" | "Medium" | "High" | "Critical";

export interface Ticket {
  id: string;
  ticket_number: string;
  month_key: string;
  staff_pin: string | null;
  staff_name: string | null;
  designation: string | null;
  project: string | null;
  contact: string | null;
  staff_email: string | null;
  mrc_receive: string | null;
  assignee_email: string | null;
  solved_by: string | null;
  anydesk: string | null;
  problem_description: string | null;
  printer_ip: string | null;
  extension: string | null;
  floor_dept: string | null;
  status: TicketStatus;
  call_type: string | null;
  priority: TicketPriority;
  created_by: string;
  created_at: string;
  updated_at: string;
  done_at: string | null;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  file_path: string;
  file_name: string;
  file_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface BracStaff {
  pin: string;
  fullName: string;
  designation: string;
  project: string;
  contact: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  room_key: string;
  sender_email: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface ChatRead {
  id: string;
  email: string;
  room_key: string;
  last_read_message_id: string | null;
  updated_at: string;
}

export interface RosterEntry {
  id: string;
  date: string;
  duty_email: string | null;
  mrc_email: string | null;
  note: string | null;
  updated_by: string | null;
  updated_at: string;
}

export type Satisfaction = "Very Satisfactory" | "Satisfactory" | "Average" | "Poor" | "Very Poor";

export interface Feedback {
  id: string;
  ticket_id: string;
  month_key: string;
  ticket_number: string | null;
  staff_pin: string | null;
  staff_name: string | null;
  program: string | null;
  solved_by_email: string | null;
  satisfaction: Satisfaction;
  score: number;
  comment: string | null;
  created_at: string;
}

export interface TicketActivity {
  id: string;
  ticket_id: string;
  actor_email: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_email: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}
