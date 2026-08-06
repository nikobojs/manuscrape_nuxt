import { captureException } from "@sentry/vue";

export const useAuth = async () => {
  const { user, refreshUser, hasFetched } = await useUser();

  const login = async (email: string, password: string) => {
    return $fetch<TokenResponse>("/api/auth", {
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
    await $fetch("/api/auth", {
      method: "DELETE",
      onResponse: async (ctx) => {
        if (ctx.response.status === 200) {
          const j = ctx.response._data;
          console.log("[Logout]: this is logout response data: ", j);
          if (j?.logoutUrl) {
            await samlSignout(j.logoutUrl, j);
            // await navigateTo(j.logoutUrl, { external: true });
          } else {
            await navigateTo("/login?sign_out=1");
          }
        } else {
          console.error("Unable to log out - response error");
          const errMsg =
            ctx?.error?.message ||
            ctx?.response?._data?.message ||
            "Unknown error";
          console.error(errMsg);
          captureException(errMsg);
          await navigateTo("/login?sign_out=1");
        }
      },
      onResponseError: async (ctx) => {
        console.error("Unable to log out - response error");
        const errMsg =
          ctx?.error?.message ||
          ctx?.response?._data?.message ||
          "Unknown error";
        console.error(errMsg);
        captureException(errMsg);
        await navigateTo("/login?sign_out=1");
      },
    });
    user.value = undefined;
  };

  const signUp = async (email: string, password: string, name: string) => {
    return $fetch<TokenResponse>("/api/user", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const ensureLoggedIn = async () => {
    if (!user.value) {
      await navigateTo("/login", { redirectCode: 302 });
    }
  };

  const ensureUserFetched = async () => {
    if (!hasFetched.value) {
      hasFetched.value = true;
      const res = await refreshUser();
      return res;
    }
  };

  const deleteUser = async (password: string) => {
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
    deleteUser,
    ensureLoggedIn,
    ensureUserFetched,
    hasFetched,
    login,
    refreshUser,
    signOut,
    signUp,
    user,
  };
};
