export const useAuth = async () => {

    const { user, refreshUser, hasFetched } = await useUser();

    const login = async (email: string, password: string) => {
        return $fetch('/api/auth', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).catch(err => {
            console.error('login catch err:', err);
            throw err;
        });
    };

    const signOut = async () => {
        await $fetch('/api/auth', { method: 'DELETE' });
        await navigateTo('/login');
        user.value = undefined;
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

    return {
        refreshUser,
        signOut,
        login,
        user,
        ensureLoggedIn,
        ensureUserFetched,
        hasFetched,
    }
};
