export const useAuth = async () => {

    const { user, refreshUser, hasFetched } = await useUser();

    const login = async (email: string, password: string) => {
        return $fetch<TokenResponse>('/api/auth', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    };

    const signOut = async () => {
        await $fetch('/api/auth', { method: 'DELETE' });
        await navigateTo('/login');
        user.value = undefined;
    }

    const signUp = async (email: string, password: string) => {
        return $fetch<TokenResponse>('/api/user', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    const ensureLoggedIn = async () => {
        await ensureUserFetched();
        if (!user.value) {
            await navigateTo('/login');
        }
    }

    const ensureUserFetched = async () => {
        if (!hasFetched.value) {
            hasFetched.value = true
            const res = await refreshUser()
            return res;
        }
    }

    const deleteUser = async (password: string) => {
        const res = await $fetch<TokenResponse>('/api/user', {
            method: 'DELETE',
            body: JSON.stringify({ password }),
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return res;
    }

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
    }
};
