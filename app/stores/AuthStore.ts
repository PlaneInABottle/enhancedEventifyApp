import { types, flow, Instance } from "mobx-state-tree"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { UserProfileModel, BusinessProfileModel } from "@/models/ProfileModels"
import { supabase } from "@/clients/supabase/SupabaseClient"
import { signIn, signUp, buildUserFromSession } from "@/services/auth"
import type { AuthUser, SignInCredentials, SignUpCredentials } from "@/services/auth"

/**
 * Authentication Store
 * 
 * Manages reactive authentication state using MobX-State-Tree
 */

const AuthUserModel = types.model("AuthUser", {
  id: types.string,
  email: types.string,
  userType: types.enumeration("UserType", ["user", "business"]),
  profile: types.maybeNull(UserProfileModel),
  businessProfile: types.maybeNull(BusinessProfileModel),
  // JWT Custom Claims (from custom_access_token_hook)
  userRole: types.optional(types.string, "user"),
  permissions: types.optional(types.array(types.string), []),
  isBusinessUser: types.optional(types.boolean, false),
  businessStatus: types.optional(types.string, "none"),
})

// ============================================================================
// AUTH STORE
// ============================================================================

export const AuthStore = types
  .model("AuthStore", {
    user: types.maybeNull(AuthUserModel),
    isLoading: types.optional(types.boolean, false),
    isAuthenticated: types.optional(types.boolean, false),
    lastError: types.maybeNull(types.string),
  })
  .actions(withSetPropAction)
  .views((self) => ({
    get userId() {
      return self.user?.id ?? null
    },
    get userEmail() {
      return self.user?.email ?? null
    },
    get userType() {
      return self.user?.userType ?? null
    },
    get hasProfile() {
      return Boolean(self.user?.profile)
    },
    get hasBusinessProfile() {
      return Boolean(self.user?.businessProfile)
    },
    

    // ========================================================================
    // ROLE & PERMISSION VIEWS
    // ========================================================================

    get userRole() {
      return self.user?.userRole ?? "user"
    },
    get permissions() {
      return self.user?.permissions ?? []
    },
    get isBusinessUser() {
      return self.user?.isBusinessUser ?? false
    },
    get businessStatus() {
      return self.user?.businessStatus ?? "none"
    },

    // Role checking methods
    get isUser() {
      return self.user?.userRole === "user"
    },
    get isBusiness() {
      return self.user?.userRole === "business"
    },
    get isModerator() {
      return self.user?.userRole === "moderator"
    },
    get isAdmin() {
      return self.user?.userRole === "admin"
    },

    // Permission checking method
    hasPermission(permission: string) {
      return self.user?.permissions?.includes(permission) ?? false
    },

    // Navigation flow determination
    get shouldUseBusinessFlow() {
      return self.user?.userType === "business"
    },
    get shouldUseUserFlow() {
      return self.user?.userType === "user"
    },
  }))
  .actions((self) => ({
    // ========================================================================
    // AUTHENTICATION ACTIONS
    // ========================================================================

    signIn: flow(function* (credentials: SignInCredentials) {
      self.setProp("isLoading", true)
      self.setProp("lastError", null)

      try {
        const result = yield signIn(credentials)

        if (result.success && result.user) {
          // Service now provides user with JWT claims
          self.setProp("user", result.user)
          self.setProp("isAuthenticated", true)
        } else {
          self.setProp("lastError", result.error || 'errors:unknownError')
          self.setProp("isAuthenticated", false)
          self.setProp("user", null)
        }

        return result
      } catch (error) {
        console.error("AuthStore.signIn error:", error)
        self.setProp("lastError", 'errors:unknownError')
        self.setProp("isAuthenticated", false)
        self.setProp("user", null)
        return { success: false, error: 'errors:unknownError' }
      } finally {
        self.setProp("isLoading", false)
      }
    }),

    signUp: flow(function* (credentials: SignUpCredentials) {
      self.setProp("isLoading", true)
      self.setProp("lastError", null)

      try {
        const result = yield signUp(credentials)

        if (result.success) {
          if (result.requiresEmailVerification) {
            // Email verification required - user needs to verify email first
            self.setProp("user", null)
            self.setProp("isAuthenticated", false)
          } else if (result.user) {
            // User is signed in immediately (no email verification required)
            // Service now provides user with JWT claims
            self.setProp("user", result.user)
            self.setProp("isAuthenticated", true)
          } else {
            // Unexpected case: success but no user and no email verification
            self.setProp("user", null)
            self.setProp("isAuthenticated", false)
          }
        } else {
          // Sign up failed
          self.setProp("lastError", result.error || 'errors:unknownError')
          self.setProp("isAuthenticated", false)
          self.setProp("user", null)
        }

        return result
      } catch (error) {
        console.error("AuthStore.signUp error:", error)
        self.setProp("lastError", 'errors:unknownError')
        self.setProp("isAuthenticated", false)
        self.setProp("user", null)
        return { success: false, error: 'errors:unknownError' }
      } finally {
        self.setProp("isLoading", false)
      }
    }),

    signOut: flow(function* () {
      self.setProp("isLoading", true)

      try {
        yield supabase.auth.signOut()
        // onAuthStateChange will handle clearing user state
      } catch (error) {
        console.error("AuthStore.signOut error:", error)
        self.setProp("lastError", 'errors:unknownError')
      } finally {
        self.setProp("isLoading", false)
      }
    }),

    clearError() {
      self.setProp("lastError", null)
    },

    // ========================================================================
    // INTERNAL SESSION MANAGEMENT
    // ========================================================================

    _handleAuthStateChange(event: string, session: any) {
      switch (event) {
        case "SIGNED_OUT":
          self.setProp("user", null)
          self.setProp("isAuthenticated", false)
          self.setProp("lastError", null)
          break

        case "INITIAL_SESSION":
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
          console.log("Event: ", event);
          const authUser = buildUserFromSession(session)
          if (authUser) {
            self.setProp("user", authUser)
            self.setProp("isAuthenticated", true)
          }
          break
      }
    },
  }))
  .actions((self) => ({
    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    afterCreate() {
      // Set up Supabase auth state listener
      supabase.auth.onAuthStateChange((event, session) => {
        self._handleAuthStateChange(event, session)
      })
    },
  }))

// ============================================================================
// TYPES
// ============================================================================

export interface AuthStore extends Instance<typeof AuthStore> { }
export interface AuthUserType extends Instance<typeof AuthUserModel> { }
export interface UserProfileType extends Instance<typeof UserProfileModel> { }
export interface BusinessProfileType extends Instance<typeof BusinessProfileModel> { }
