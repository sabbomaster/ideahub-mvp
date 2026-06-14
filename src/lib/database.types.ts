export type IdeaType = "rough" | "serious";
export type IdeaStatus = "active" | "completed" | "archived";
export type IdeaSource = "manual" | "mental_seesaw";
export type IdeaVisibility = "public" | "private";
export type ExecutionPermission = "owner_only" | "public";
export type ExecutionKind = "self" | "report";
export type MentalSeesawItemKind = "positive" | "negative";
export type LikeTargetType = "idea" | "comment";
export type ReportTargetType = "idea" | "comment" | "profile";
export type FeedbackReportType = "bug" | "question" | "improvement" | "other";
export type NotificationType = "comment" | "improvement" | "execution";

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  credit_score: number;
  created_at: string;
  updated_at: string;
};

export type Idea = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: IdeaType;
  status: IdeaStatus;
  status_before_archive: Exclude<IdeaStatus, "archived"> | null;
  source: IdeaSource;
  visibility: IdeaVisibility;
  execution_permission: ExecutionPermission;
  image_url: string | null;
  image_urls: string[];
  archived_at: string | null;
  hidden_at: string | null;
  delete_scheduled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  idea_id: string;
  user_id: string;
  body: string;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

export type MentalSeesaw = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  context: string | null;
  final_decision: string | null;
  next_action: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type MentalSeesawItem = {
  id: string;
  seesaw_id: string;
  user_id: string;
  kind: MentalSeesawItemKind;
  content: string;
  weight: number;
  relief_method: string | null;
  created_at: string;
  updated_at: string;
};

export type MentalSeesawSuggestion = {
  id: string;
  seesaw_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type FeedbackReport = {
  id: string;
  user_id: string | null;
  type: FeedbackReportType;
  content: string;
  page_url: string | null;
  contact: string | null;
  created_at: string;
};

export type IdeaPostErrorLog = {
  id: string;
  user_id: string | null;
  email: string | null;
  title_length: number;
  body_length: number;
  category: string | null;
  visibility: string | null;
  execution_permission: string | null;
  error_message: string;
  stack_trace: string | null;
  occurred_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  idea_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Omit<Profile, "created_at" | "updated_at">> & { id: string };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      ideas: {
        Row: Idea;
        Insert: Omit<Idea, "id" | "created_at" | "updated_at" | "status" | "status_before_archive" | "source" | "visibility" | "execution_permission" | "image_url" | "image_urls" | "archived_at" | "hidden_at" | "delete_scheduled_at"> &
          Partial<Pick<Idea, "status" | "status_before_archive" | "source" | "visibility" | "execution_permission" | "image_url" | "image_urls" | "archived_at" | "hidden_at" | "delete_scheduled_at">>;
        Update: Partial<Omit<Idea, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, "id" | "created_at" | "updated_at" | "image_path"> & Partial<Pick<Comment, "image_path">>;
        Update: Partial<Omit<Comment, "id" | "idea_id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          target_type: LikeTargetType;
          target_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          target_type: LikeTargetType;
          target_id: string;
        };
        Update: never;
        Relationships: [];
      };
      executions: {
        Row: {
          id: string;
          idea_id: string;
          user_id: string;
          kind: ExecutionKind;
          note: string | null;
          created_at: string;
        };
        Insert: {
          idea_id: string;
          user_id: string;
          kind?: ExecutionKind;
          note?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: ReportTargetType;
          target_id: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          target_type: ReportTargetType;
          target_id: string;
          reason: string;
        };
        Update: never;
        Relationships: [];
      };
      feedback_reports: {
        Row: FeedbackReport;
        Insert: Omit<FeedbackReport, "id" | "created_at"> & Partial<Pick<FeedbackReport, "id" | "created_at">>;
        Update: never;
        Relationships: [];
      };
      idea_post_error_logs: {
        Row: IdeaPostErrorLog;
        Insert: Omit<IdeaPostErrorLog, "id" | "occurred_at"> & Partial<Pick<IdeaPostErrorLog, "id" | "occurred_at">>;
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at" | "read_at"> & Partial<Pick<Notification, "id" | "created_at" | "read_at">>;
        Update: Partial<Pick<Notification, "read_at">>;
        Relationships: [];
      };
      mental_seesaws: {
        Row: MentalSeesaw;
        Insert: Omit<MentalSeesaw, "id" | "created_at" | "updated_at" | "final_decision" | "next_action" | "is_public"> &
          Partial<Pick<MentalSeesaw, "final_decision" | "next_action" | "is_public">>;
        Update: Partial<Omit<MentalSeesaw, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      mental_seesaw_items: {
        Row: MentalSeesawItem;
        Insert: Omit<MentalSeesawItem, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<MentalSeesawItem, "id" | "seesaw_id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      mental_seesaw_suggestions: {
        Row: MentalSeesawSuggestion;
        Insert: Omit<MentalSeesawSuggestion, "id" | "created_at">;
        Update: Partial<Omit<MentalSeesawSuggestion, "id" | "seesaw_id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
    Functions: {
      add_credit: {
        Args: { target_user_id: string; amount: number };
        Returns: void;
      };
      credit_for_imagined_tip: {
        Args: { target_idea_id: string };
        Returns: void;
      };
    };
    Views: Record<string, never>;
    Enums: {
      idea_type: IdeaType;
      like_target_type: LikeTargetType;
      report_target_type: ReportTargetType;
    };
    CompositeTypes: Record<string, never>;
  };
};
