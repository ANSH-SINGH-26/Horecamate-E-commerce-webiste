import { create } from "zustand";
import { supabase, Profile } from "../lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null, session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  setUser: (user, session) => set({ user, session }),
  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        // Profile not found, let's attempt to create one to self-heal
        const result = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            role: "customer",
          })
          .select()
          .single();

        data = result.data;
        error = result.error as any;
      }

      if (data && !error) {
        set({ profile: data as Profile });
      } else if (error) {
        console.error("Error fetching/creating profile:", error);
      }
    } catch (err) {
      console.error("Error in profile flow:", err);
    } finally {
      set({ isLoading: false });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },
}));

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setUser(session?.user ?? null, session);
  if (session?.user) {
    useAuthStore.getState().fetchProfile();
  } else {
    useAuthStore.setState({ isLoading: false });
  }
});

supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setUser(session?.user ?? null, session);
  if (session?.user) {
    useAuthStore.getState().fetchProfile();
  } else {
    useAuthStore.setState({ profile: null, isLoading: false });
  }
});
