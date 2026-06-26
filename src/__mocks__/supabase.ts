const mockAuth = {
  getSession: async () => ({ data: { session: null } }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  signInWithOAuth: async () => ({ error: null }),
  signInWithPassword: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithOtp: async () => ({ error: null }),
  verifyOtp: async () => ({ error: null }),
  signOut: async () => {},
};

const mockFrom = () => ({
  select: () => ({ data: [], error: null, single: () => ({ data: null, error: null }) }),
  insert: () => ({ select: () => ({ single: () => ({ data: { id: 'mock' }, error: null }) }), data: null, error: null }),
  update: () => ({ eq: () => ({ data: null, error: null }) }),
  delete: () => ({ eq: () => ({ data: null, error: null }) }),
  eq: () => ({ data: [], error: null }),
});

export const supabase = {
  auth: mockAuth,
  from: mockFrom,
};
