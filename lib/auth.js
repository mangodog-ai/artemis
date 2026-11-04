import "server-only";

import AzureADProvider from "next-auth/providers/azure-ad";

const configuredTenantId = process.env.AZURE_AD_TENANT_ID ?? "";
const tenantIdPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const hasValidTenantId = tenantIdPattern.test(configuredTenantId);

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID ?? "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
      tenantId: hasValidTenantId ? configuredTenantId : "invalid",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username ?? null,
          email: profile.email ?? profile.preferred_username ?? null,
          image: null,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
};

export function isAzureAuthConfigured() {
  return Boolean(
    process.env.AZURE_AD_CLIENT_ID &&
      process.env.AZURE_AD_CLIENT_SECRET &&
      hasValidTenantId &&
      process.env.NEXTAUTH_SECRET &&
      process.env.NEXTAUTH_URL,
  );
}
