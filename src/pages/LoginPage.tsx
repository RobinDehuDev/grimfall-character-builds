import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { Sword } from "lucide-react";
import { ClerkSignInPlaceholder } from "../components/layout/Header";
import {
  FantasyCard,
  CardContent,
} from "@/components/ui/fantasy-card";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate("/builds/new", { replace: true });
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded || isSignedIn) return null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Sword className="mx-auto mb-4 size-8 text-gold" strokeWidth={1.25} />
          <h1 className="mb-1.5 font-display text-2xl text-gold">{t("auth.enterForge")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.enterForgeBody")}
          </p>
        </div>

        <FantasyCard>
          <CardContent className="pt-6">
            <ClerkSignInPlaceholder />
          </CardContent>
        </FantasyCard>
      </div>
    </div>
  );
}
