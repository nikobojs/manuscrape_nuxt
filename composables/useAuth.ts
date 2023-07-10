const useUser = async () => {
    const state = useState<CurrentUser | null>('user', () => null);

    const {
        refresh: refreshUser,
        pending: loading,
    } = await useFetch<CurrentUser>('/api/user', {
        method: 'GET',
        default: () => null,
        immediate: !state.value,
        
        onResponse: (context) => {
            if (context.response.status === 200) {
                state.value = context.response._data;
            } else {
                state.value = null;
            }
        }
    });

    return {
        user: state,
        refreshUser,
        loading,
    };
}

export const useAuth = async () => {

    const { user, refreshUser } = await useUser();

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
        }).then(async (response) => {
            if (response?.token) {
                await refreshUser();
                await navigateTo('/')
            }            
        })
    };

    const signOut = async () => {
        await $fetch('/api/auth', { method: 'DELETE' });
        user.value = null;
    }

    const isLoggedIn = computed(() => {
        return !!user.value;
    });

    return {
        isLoggedIn,
        refreshUser,
        signOut,
        login,
        user,
    }
};
