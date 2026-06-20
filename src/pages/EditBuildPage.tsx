import { useParams } from "react-router-dom";
import { BuildEditor } from "../components/build/BuildEditor";
import type { Id } from "../../convex/_generated/dataModel";

export function EditBuildPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <BuildEditor mode="edit" buildId={id as Id<"builds">} />;
}
