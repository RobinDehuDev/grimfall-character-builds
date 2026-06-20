import { useUser } from "@clerk/react";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../convex/_generated/api";

export function AuthSync() {
  const { t } = useTranslation();
  const { isSignedIn, user } = useUser();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (isSignedIn && user) {
      const name =
        user.fullName ||
        user.username ||
        user.primaryEmailAddress?.emailAddress ||
        t("auth.adventurer");
      void storeUser({ name });
    }
  }, [isSignedIn, user, storeUser, t]);

  return null;
}
