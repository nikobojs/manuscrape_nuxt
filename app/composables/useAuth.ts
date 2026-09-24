import { captureException } from "@sentry/vue";

export const useAuth = async () => {
  const { user, refreshUser, hasFetched, resetUserState } = await useUser();

  const login = async (email: string, password: string) => {
    return $fetch<{ success: boolean }>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  // NOTE: needs to be a browser that POSTs the query params securely as a form
  async function samlSignout(
    logoutUrl: string,
    params: { SAMLRequest: string; RelayState: string; logoutUrl: string },
  ) {
    // Create a hidden form
    const form = document.createElement("form");
    form.method = "POST";
    form.action = logoutUrl;
    form.style.display = "none";

    // Extract base URL and query params from logoutUrl
    const url = new URL(logoutUrl);

    // Append all query params as hidden inputs (SAMLRequest, RelayState, etc.)
    Object.entries({
      SAMLRequest: params.SAMLRequest,
      RelayState: params.RelayState,
    }).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    // Override action to base URL without query string
    form.action = `${url.origin}${url.pathname}`;

    document.body.appendChild(form);
    form.submit();
  }

  const signOut = async () => {
    let res: any;
    try {
      res = await $fetch("/api/auth", { method: "DELETE" });
    } catch (err: any) {
      // Log out locally even if the server call failed
      console.error("Unable to log out - response error", err);
      captureException(err);
    }

    // Clear the app auth state BEFORE navigating, so that route middleware
    // (auth/guest) sees the logged-out state instead of bouncing us
    // straight back to /projects.
    resetUserState();

    if (res?.logoutUrl) {
      await samlSignout(res.logoutUrl, res);
    } else {
      await navigateTo("/login?sign_out=1", { replace: true });
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    return $fetch<{ user: CurrentUser }>("/api/user", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const ensureUserFetched = async () => {
    hasFetched.value = true;
    if (!user.value) {
      // dedupe: "defer" joins a /api/user fetch that is already in flight
      // (e.g. the one started by the Header) instead of cancelling and
      // restarting it
      await refreshUser({ dedupe: "defer" });
    }
  };

  const deleteUserAccount = async (password: string) => {
    const res = await $fetch("/api/user", {
      method: "DELETE",
      body: JSON.stringify({ password }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res;
  };

  return {
    deleteUserAccount,
    ensureUserFetched,
    hasFetched,
    login,
    refreshUser,
    signOut,
    signUp,
    user,
  };
};
