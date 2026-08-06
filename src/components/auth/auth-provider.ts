"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";

export const OIDC_PROVIDER_ID = "oidc";
export const DEV_PROVIDER_ID = "credentials";

export const usePreferredAuthProvider = () => {
    const [providerId, setProviderId] = useState<string | null>(null);
    const [providersLoaded, setProvidersLoaded] = useState(false);

    useEffect(() => {
        let active = true;

        getProviders()
            .then((providers) => {
                if (active) {
                    setProviderId(providers?.[OIDC_PROVIDER_ID]?.id ?? providers?.[DEV_PROVIDER_ID]?.id ?? null);
                    setProvidersLoaded(true);
                }
            })
            .catch(() => {
                if (active) {
                    setProviderId(null);
                    setProvidersLoaded(true);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return { providerId, providersLoaded };
};

export const signInWithProvider = (providerId: string) => {
    if (providerId === OIDC_PROVIDER_ID) {
        void signIn(OIDC_PROVIDER_ID, { redirectTo: "/" });
        return;
    }

    if (providerId === DEV_PROVIDER_ID) {
        void signIn(DEV_PROVIDER_ID, {
            email: "demo@musica.local",
            name: "Ritumoni Sarma",
            redirectTo: "/",
        });
    }
};
