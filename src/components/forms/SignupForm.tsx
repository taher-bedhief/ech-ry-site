"use client";

import Cookies from "js-cookie"; 
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { setAuthenticated, setCurrentUser } from "@/lib/features/auth/authSlice";
import fetchData from "@/lib/fetchDataFromApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { LuLoader } from "react-icons/lu";
import { useDispatch } from "react-redux";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";

// 🔹 Validation avec Zod
const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupFormProps = {
  setIsOpen?: Dispatch<SetStateAction<boolean>>;
};

// 🔹 Utilitaire pour dev/prod
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isProd = host === "ech-ry.com" || host.endsWith(".ech-ry.com");
    return isProd ? "https://www.ech-ry.com" : "http://localhost:3000";
  }
  return "/";
};

export default function SignupForm({ setIsOpen }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"signup" | "confirm">("signup");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // 🔹 Étape 1 : inscription
  const handleSignup = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setFormData(values);

    try {
      await fetchData.post("/auth/register", values);
      toast({
        title: "Signup successful",
        description: "Check your email for the confirmation code",
        variant: "success",
      });
      setStep("confirm");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || "Registration failed. Please try again.";
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      if (errorMessage.includes("email")) form.setError("email", { message: errorMessage });
      else if (errorMessage.includes("password")) form.setError("password", { message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Étape 2 : confirmation + login automatique + redirection
  const handleConfirm = async () => {
    if (!confirmationCode) return;
    setIsLoading(true);

    try {
      await fetchData.post("/auth/confirm", { email: formData.email, code: confirmationCode });

      const loginRes = await fetchData.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      if (loginRes.data.success && loginRes.data.user) {
        const userData = loginRes.data.user;

        dispatch(setAuthenticated(true));
        dispatch(setCurrentUser(userData));

        const baseUrl = getBaseUrl();
        const redirectTo = searchParams.get("redirect") || "/";

        Cookies.set("accessToken", loginRes.data.accessToken, {
          path: "/",
          secure: baseUrl.includes("ech-ry.com"),
          sameSite: "lax",
        });

        toast({
          title: "Account confirmed",
          description: "You are now logged in!",
          variant: "success",
        });

        if (setIsOpen) setIsOpen(false);

        // ✅ Redirection côté frontend (toujours fiable)
        router.replace(redirectTo);
      }
    } catch (err: any) {
      toast({
        title: "Confirmation failed",
        description: err?.response?.data?.error || "Invalid code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
    const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!;
    const scopes = process.env.NEXT_PUBLIC_COGNITO_SCOPES || "openid email profile";

    const url = `${domain}/oauth2/authorize?identity_provider=Google&response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes)}&prompt=select_account`;

    window.location.href = url;
  };

  return (
    <Form {...form}>
      {step === "signup" ? (
        <form onSubmit={form.handleSubmit(handleSignup)} className="flex flex-col gap-3">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input type="text" placeholder="Name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="Email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Password avec œil 👁️ */}
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Password" {...field} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-gray-500">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button type="submit" disabled={isLoading} className="w-full mt-3 h-12 gap-3">
            <span>Sign Up</span>
            {isLoading && <span className="text-base animate-spin"><LuLoader /></span>}
          </Button>

          <div className="flex gap-3 items-center justify-center my-3">
            <div className="flex-1 h-0.5 bg-muted" />
            <p className="text-muted">Or</p>
            <div className="flex-1 h-0.5 bg-muted" />
          </div>

          <Button type="button" className="w-full h-12 flex gap-4 bg-gray-900 border-input hover:text-white hover:bg-gray-800" onClick={handleGoogleSignup}>
            <span className="text-3xl"><FcGoogle /></span>
            <span>Sign Up with Google</span>
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-center text-muted">Enter the confirmation code sent to <strong>{formData.email}</strong></p>
          <Input placeholder="Confirmation code" value={confirmationCode} onChange={(e) => setConfirmationCode(e.target.value)} />
          <Button onClick={handleConfirm} disabled={isLoading} className="w-full mt-3 h-12 gap-3">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LuLoader className="animate-spin" />
                Confirming...
              </span>
            ) : (
              "Confirm Account"
            )}
          </Button>
        </div>
      )}
    </Form>
  );
}
