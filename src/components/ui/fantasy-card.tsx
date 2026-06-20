import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function FantasyCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "border-gold-muted/60 bg-gradient-to-b from-card/90 to-card/70 shadow-lg shadow-black/40",
        className,
      )}
      {...props}
    />
  );
}

export {
  FantasyCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
