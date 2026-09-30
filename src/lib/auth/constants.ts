/** Cookie names shared by the route handlers and the route proxy (all httpOnly). */
export const ACCESS_COOKIE = "vm_admin_access";
export const REFRESH_COOKIE = "vm_admin_refresh";
/** Short-lived 2FA temp_token / setup_token between the password and TOTP steps. */
export const PENDING_COOKIE = "vm_admin_pending";

/** Backend refresh cookie (path /auth/admin) — forwarded server-to-server only. */
export const BACKEND_REFRESH_COOKIE = "admin_refresh_token";

export const SIGNIN_PATH = "/auth/admin/signin";

/** Fired on window when an API call returns 401 after the refresh attempt. */
export const SESSION_EXPIRED_EVENT = "vitamind:session-expired";
