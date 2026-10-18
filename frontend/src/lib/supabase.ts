import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

export const getSupabaseUrl = (): string => {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
};

export const getSupabaseKey = (): string => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
};

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return (
    url.length > 0 &&
    !url.includes("your-project-id") &&
    key.length > 0 &&
    !key.includes("your-anon-key") &&
    !key.includes("placeholder")
  );
};

// Factory for client-side components using @supabase/ssr
export const createClient = (): SupabaseClient => {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!isSupabaseConfigured()) {
    return createSupabaseClient(
      "https://placeholder-project.supabase.co",
      "placeholder-anon-key"
    );
  }

  return createBrowserClient(url, key);
};

// Reusable singleton client for client-side hooks & services
export const supabase: SupabaseClient = createClient();

export interface AnalysisRecord {
  id: string;
  user_id?: string;
  filename: string;
  file_size_bytes?: number;
  predicted_grade: number;
  predicted_grade_label: string;
  severity_label: string;
  confidence: number;
  probabilities: {
    grade: number;
    label: string;
    probability: number;
  }[];
  model_name: string;
  model_version: string;
  inference_time_ms: number;
  clahe_applied: boolean;
  has_gradcam: boolean;
  notes?: string;
  created_at: string;
  original_image_base64?: string;
  gradcam_heatmap_base64?: string;
  gradcam_overlay_base64?: string;
}

const LOCAL_STORAGE_KEY = "kneeai_local_analyses";

export async function saveAnalysis(
  record: AnalysisRecord,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  // If Supabase is configured and user is authenticated, attempt database persistence
  if (isSupabaseConfigured() && userId) {
    try {
      const { error } = await supabase.from("analyses").insert([
        {
          id: record.id,
          user_id: userId,
          filename: record.filename,
          file_size_bytes: record.file_size_bytes,
          predicted_grade: record.predicted_grade,
          predicted_grade_label: record.predicted_grade_label,
          severity_label: record.severity_label,
          confidence: record.confidence,
          probabilities: record.probabilities,
          model_name: record.model_name,
          model_version: record.model_version,
          inference_time_ms: record.inference_time_ms,
          clahe_applied: record.clahe_applied,
          has_gradcam: record.has_gradcam,
          notes: record.notes,
        },
      ]);

      if (error) {
        console.warn(
          "Supabase insert error (table may need schema migration), caching locally:",
          error.message
        );
      } else {
        return { success: true };
      }
    } catch (err: unknown) {
      console.warn("Supabase connection issue, using local storage:", err);
    }
  }

  // Graceful browser-side fallback storage
  if (typeof window !== "undefined") {
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      existing.unshift(record);
      // Keep last 50 records
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
      return { success: true };
    } catch {
      return { success: false, error: "Failed to persist analysis to local storage." };
    }
  }

  return { success: true };
}

export async function fetchAnalyses(userId?: string): Promise<AnalysisRecord[]> {
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as AnalysisRecord[];
      }
    } catch (err) {
      console.warn("Could not query Supabase analyses, reading local store:", err);
    }
  }

  // Read local store fallback
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  return [];
}
