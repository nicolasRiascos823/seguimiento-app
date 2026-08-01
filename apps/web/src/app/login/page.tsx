"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo iniciar sesión"));
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#00304d]">
      {/* Atmosphere — azul oscuro + verde institucional SENA */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 15% 20%, rgba(57, 169, 0, 0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 80%, rgba(0, 48, 77, 0.9), transparent 50%), linear-gradient(160deg, #00304d 0%, #012338 48%, #041019 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 px-6 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-10">
        {/* Brand */}
        <div className="animate-in max-w-xl text-white lg:flex-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#8fe05a]">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            SENA
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Seguimiento
            <span className="block text-[#d5f0c3]">de aprendices</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
            Evolución académica y disciplinaria con historial completo por ficha.
          </p>
          <dl className="mt-8 hidden gap-6 text-sm text-white/70 sm:grid sm:grid-cols-3">
            <div>
              <dt className="font-medium text-white">Fichas</dt>
              <dd className="mt-1">Instructores líderes</dd>
            </div>
            <div>
              <dt className="font-medium text-white">Historial</dt>
              <dd className="mt-1">Append-only</dd>
            </div>
            <div>
              <dt className="font-medium text-white">Roles</dt>
              <dd className="mt-1">Admin · Instructor</dd>
            </div>
          </dl>
        </div>

        {/* Form — interaction surface, not a decorative card stack */}
        <div className="animate-in w-full max-w-md lg:flex-none">
          <div className="rounded-xl bg-[#f3f5f4] p-7 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.55)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Iniciar sesión
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Correo institucional del sistema.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error ? (
                <Alert variant="destructive" title="No autenticado">
                  {error}
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="usuario@sena.edu.co"
                  error={!!errors.email}
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  error={!!errors.password}
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                ) : null}
              </div>

              <Button type="submit" className="mt-2 w-full" size="lg" loading={isSubmitting}>
                Entrar al sistema
              </Button>
            </form>
          </div>
          <p className="mt-4 text-center text-xs text-white/55">
            Acceso restringido a usuarios autorizados
          </p>
        </div>
      </div>
    </div>
  );
}
