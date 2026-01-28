import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettings, PasswordSettings } from "@/components/admin/settings";
import { Settings, Shield } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-500" />
          Paramètres
        </h1>
        <p className="text-gray-500 mt-1">
          Gérez votre compte et vos préférences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProfileSettings email={user.email || ""} />
        <PasswordSettings />
      </div>

      {/* Section informative sur les clés API */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Shield className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Clés API & Configuration</h3>
            <p className="text-sm text-gray-500 mt-1">
              Les clés API (OpenAI, Unsplash) et les paramètres de configuration sont gérés
              de manière sécurisée via les variables d&apos;environnement sur le serveur.
              Contactez votre administrateur système pour les modifier.
            </p>
            <div className="mt-3 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Variables configurées :</span>
              </p>
              <ul className="mt-1 space-y-1 text-gray-500">
                <li>• OPENAI_API_KEY - Génération d&apos;articles IA</li>
                <li>• UNSPLASH_ACCESS_KEY - Images d&apos;articles</li>
                <li>• CRON_SECRET - Sécurisation des tâches planifiées</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
