"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail, Check } from "lucide-react";
import { updateEmail } from "@/lib/actions/auth";
import { toast } from "sonner";

interface ProfileSettingsProps {
  email: string;
}

export function ProfileSettings({ email }: ProfileSettingsProps) {
  const [newEmail, setNewEmail] = useState(email);
  const [loading, setLoading] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);

  const hasChanges = newEmail !== email;

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();

    if (!newEmail || newEmail === email) return;

    setLoading(true);
    const result = await updateEmail(newEmail);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Un email de confirmation a été envoyé à votre nouvelle adresse");
    setEmailChanged(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-indigo-500" />
          Adresse email
        </CardTitle>
        <CardDescription>
          Modifiez votre adresse email de connexion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setEmailChanged(false);
              }}
              placeholder="votre@email.com"
              disabled={loading}
            />
            {emailChanged && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" />
                Vérifiez votre boîte mail pour confirmer le changement
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !hasChanges}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Modifier l&apos;email
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
