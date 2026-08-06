import NextAuth, { type NextAuthConfig, type Profile } from "next-auth";
import type { OIDCConfig } from "next-auth/providers";

const OIDC_PROVIDER_ID = "oidc";

const oidcProviderConfigured = Boolean(
    process.env.OIDC_ISSUER &&
    process.env.OIDC_CLIENT_ID &&
    process.env.OIDC_CLIENT_SECRET,
);

const createOidcProvider = (): OIDCConfig<Profile> => ({
    id: OIDC_PROVIDER_ID,
    name: process.env.OIDC_NAME || "OIDC",
    type: "oidc",
    issuer: process.env.OIDC_ISSUER,
    wellKnown: process.env.OIDC_WELL_KNOWN || undefined,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    authorization: {
        params: {
            scope: process.env.OIDC_SCOPE || "openid profile email",
        },
    },
    checks: ["pkce", "state", "nonce"],
    profile(profile) {
        const id = profile.sub ?? profile.id ?? profile.email ?? profile.preferred_username ?? "oidc-user";
        const name = profile.name ?? profile.preferred_username ?? profile.email ?? "OIDC User";

        return {
            id: String(id),
            name,
            email: profile.email,
            image: typeof profile.picture === "string" ? profile.picture : null,
        };
    },
});

export const authConfig = {
    trustHost: true,
    session: {
        strategy: "jwt",
    },
    providers: oidcProviderConfigured ? [createOidcProvider()] : [],
    callbacks: {
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub ?? session.user.id;
            }

            return session;
        },
    },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
