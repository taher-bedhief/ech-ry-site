"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  User,
  setAuthenticated,
  setCurrentUser,
} from "@/lib/features/auth/authSlice";
import fetchData from "@/lib/fetchDataFromApi";
import { useAppSelector } from "@/lib/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { LuLoader } from "react-icons/lu";
import { useDispatch } from "react-redux";
import { useToast } from "../ui/use-toast";
import { Eye, EyeOff } from "lucide-react"; // 👁️ icons
import { signIn } from "next-auth/react"; // ✅ NextAuth import

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormProps = {
  setIsOpen?: Dispatch<SetStateAction<boolean>>;
  redirect?: string;
};

export function LoginForm({ setIsOpen, redirect }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁️ state
  const { cartItems } = useAppSelector((state) => state.cart);
  const dispatch = useDispatch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const redirectTo = searchParams.get("redirect") || redirect || "/";

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // ✅ fetchData.post accepte seulement (url, data)
      const res = await fetchData.post("/auth/login", values);

      if (res.data.success) {
        // ✅ Pas de Cookies.set ici → backend gère les cookies httpOnly
        dispatch(setCurrentUser(res.data.user as User));
        dispatch(setAuthenticated(true));

        form.reset();
        setIsLoading(false);
        setIsOpen && setIsOpen(false);

        toast({
          title: "Success",
          description: "You have successfully logged in",
          variant: "success",
        });

        if (redirectTo === "/checkout" && cartItems.length === 0) {
          toast({
            title: "Empty Cart",
            description:
              "Please add items to your cart before checking out",
          });
          router.replace("/");
        } else {
          router.replace(redirectTo);
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Authentication failed",
        description:
          error.response?.data?.error || "Please try again",
        variant: "destructive",
      });
    }
  }

  // ✅ Nouveau : login via Keycloak (mais affichage Google)
  const handleGoogleLoginWithKeycloak = () => {
    signIn("keycloak"); // redirection vers Keycloak
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"} // 👁️ toggle
                    placeholder="Enter your password"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <LuLoader className="animate-spin" />
              Please wait...
            </span>
          ) : (
            "Login"
          )}
        </Button>

        {/* ✅ Bouton Google (via Keycloak) */}
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={handleGoogleLoginWithKeycloak}
        >
          <FcGoogle className="text-xl" />
          Login with Google
        </Button>
      </form>
    </Form>
  );
}
