import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SignInButton, SignOutButton, useAuth } from "@clerk/react";
import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import {
  Bug,
  FileText,
  Key,
  Plus,
  Shield,
  Sword,
  User,
  type LucideIcon,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { isAdmin } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ChangeNicknameModal } from "@/components/auth/ChangeNicknameModal";

const menuButtonClass =
  "w-full px-3 py-2 text-left font-display text-[10px] tracking-widest text-muted-foreground uppercase transition-colors hover:bg-secondary hover:text-gold";

function UserMenu() {
  const { t } = useTranslation();
  const currentUser = useQuery(api.users.current);
  const [open, setOpen] = useState(false);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-gold"
        aria-label={t("nav.accountMenu")}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <User className="size-4" strokeWidth={1.5} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-md border border-gold-muted/60 bg-popover py-1 shadow-lg">
          <button
            type="button"
            className={menuButtonClass}
            onClick={() => {
              setOpen(false);
              setNicknameModalOpen(true);
            }}
          >
            {t("nav.changeNickname")}
          </button>
          <SignOutButton>
            <button
              type="button"
              className={menuButtonClass}
              onClick={() => setOpen(false)}
            >
              {t("nav.signOut")}
            </button>
          </SignOutButton>
        </div>
      )}
      <ChangeNicknameModal
        open={nicknameModalOpen}
        currentNickname={currentUser?.name ?? ""}
        onClose={() => setNicknameModalOpen(false)}
      />
    </div>
  );
}

function NavItem({
  to,
  icon: Icon,
  children,
  isActive: isActiveFn,
  disabled,
  title,
}: {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
  isActive?: (pathname: string) => boolean;
  disabled?: boolean;
  title?: string;
}) {
  const { pathname } = useLocation();
  const active = isActiveFn ? isActiveFn(pathname) : pathname === to;

  const className = cn(
    "flex items-center gap-2 px-3 py-2 font-display text-[11px] font-medium tracking-widest uppercase transition-colors no-underline",
    disabled
      ? "cursor-not-allowed opacity-50"
      : active
        ? "text-gold"
        : "text-muted-foreground hover:text-gold",
  );

  if (disabled) {
    return (
      <span className={className} title={title} aria-disabled="true">
        <Icon className="size-3.5 shrink-0" strokeWidth={1.5} />
        {children}
      </span>
    );
  }

  return (
    <Link to={to} className={className}>
      <Icon className="size-3.5 shrink-0" strokeWidth={1.5} />
      {children}
    </Link>
  );
}

export function Header() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const currentUser = useQuery(api.users.current);

  return (
    <header className="border-b border-gold-muted/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 md:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 no-underline hover:opacity-90"
        >
          <Sword className="size-5 text-gold" strokeWidth={1.5} />
          <span className="font-display text-sm font-semibold tracking-[0.2em] text-gold">
            {t("brand.name")}
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          <NavItem to="/builds" icon={FileText} isActive={(p) => p === "/builds"}>
            {t("nav.sharedBuilds")}
          </NavItem>
          {isSignedIn && (
            <NavItem
              to="/builds/mine"
              icon={Key}
              isActive={(p) =>
                p === "/builds/mine" ||
                p === "/builds/new" ||
                /^\/builds\/[^/]+\/edit$/.test(p)
              }
            >
              {t("nav.myBuilds")}
            </NavItem>
          )}
          <NavItem
            to="/builds"
            icon={Shield}
            disabled
            title={t("common.workInProgress")}
          >
            {t("nav.compare")}
          </NavItem>
          {isAdmin(currentUser?.roles) && (
            <NavItem to="/admin" icon={Plus} isActive={(p) => p.startsWith("/admin")}>
              {t("nav.admin")}
            </NavItem>
          )}
          {isSignedIn && (
            <NavItem to="/bug-report" icon={Bug} isActive={(p) => p === "/bug-report"}>
              {t("nav.bugReport")}
            </NavItem>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          {isSignedIn ? (
            <UserMenu />
          ) : (
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                {t("nav.signInUp")}
              </Button>
            </SignInButton>
          )}
        </div>
      </div>

      <nav className="flex items-center justify-center gap-1 border-t border-gold-muted/40 px-2 py-1 md:hidden">
        <NavItem to="/builds" icon={FileText} isActive={(p) => p === "/builds"}>
          {t("nav.sharedShort")}
        </NavItem>
        {isSignedIn && (
          <NavItem
            to="/builds/mine"
            icon={Key}
            isActive={(p) =>
              p === "/builds/mine" ||
              p === "/builds/new" ||
              /^\/builds\/[^/]+\/edit$/.test(p)
            }
          >
            {t("nav.myShort")}
          </NavItem>
        )}
        {isAdmin(currentUser?.roles) && (
          <NavItem to="/admin" icon={Plus}>
            {t("nav.admin")}
          </NavItem>
        )}
      </nav>
    </header>
  );
}

export function ClerkSignInPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="mb-4 rounded-md border border-dashed border-gold-muted/60 bg-background p-8 text-center">
      <Sword className="mx-auto mb-4 size-8 text-gold" strokeWidth={1.25} />
      <div className="mb-3 font-display text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
        {t("auth.signInTitle")}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{t("auth.signInBody")}</p>
      <SignInButton mode="modal">
        <Button type="button">{t("auth.signInClerk")}</Button>
      </SignInButton>
    </div>
  );
}
