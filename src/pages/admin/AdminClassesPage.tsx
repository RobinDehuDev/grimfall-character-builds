import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PageHeader, LoadingState, EmptyState } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FantasyCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/fantasy-card";

export function AdminClassesPage() {
  const { t } = useTranslation();
  const classes = useQuery(api.classes.list);
  const createClass = useMutation(api.classes.create);
  const updateClass = useMutation(api.classes.update);
  const removeClass = useMutation(api.classes.remove);

  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<Id<"classes"> | null>(null);

  if (classes === undefined) {
    return <LoadingState />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingId) {
      await updateClass({ id: editingId, name: name.trim(), sortOrder });
    } else {
      await createClass({ name: name.trim(), sortOrder });
    }
    setName("");
    setSortOrder(classes.length);
    setEditingId(null);
  };

  const startEdit = (cls: (typeof classes)[0]) => {
    setEditingId(cls._id);
    setName(cls.name);
    setSortOrder(cls.sortOrder);
  };

  return (
    <>
      <PageHeader
        title={t("admin.manageClasses")}
        description={<Link to="/admin">{t("common.backToAdmin")}</Link>}
      />

      <form onSubmit={handleSubmit} className="mb-6">
        <FantasyCard>
          <CardHeader className="border-b border-gold-muted/40 pb-3">
            <CardTitle className="font-display text-sm tracking-widest text-gold uppercase">
              {editingId ? t("admin.editClass") : t("admin.addClass")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("common.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.sortOrder")}</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingId ? t("common.update") : t("common.add")}</Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                  }}
                >
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </CardContent>
        </FantasyCard>
      </form>

      <FantasyCard>
        <CardHeader className="border-b border-gold-muted/40 pb-3">
          <CardTitle className="font-display text-sm tracking-widest text-gold uppercase">
            {t("admin.classesCount", { count: classes.length })}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {classes.length === 0 ? (
            <EmptyState>{t("admin.noClasses")}</EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("admin.sortOrder")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls._id}>
                    <TableCell>{cls.name}</TableCell>
                    <TableCell>{cls.sortOrder}</TableCell>
                    <TableCell className="space-x-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(cls)}>
                        {t("common.edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(t("admin.deleteClassConfirm", { name: cls.name }))) {
                            void removeClass({ id: cls._id });
                          }
                        }}
                      >
                        {t("common.delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </FantasyCard>
    </>
  );
}
