"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { setAuthenticated, setCurrentUser } from "@/lib/features/auth/authSlice";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react"; // 👁️ icônes

const ChangePasswordPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 👁️ states pour afficher/masquer chaque champ
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing Fields",
        description: "All fields are required.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (data.toast) {
        toast(data.toast);
      }

      if (!res.ok) {
        throw new Error(data.toast?.description || "Error while changing password");
      }

      dispatch(setCurrentUser(null));
      dispatch(setAuthenticated(false));

      setTimeout(() => {
        router.push("/login");
      }, 2000);

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-semibold mb-4">Change Password</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Old Password */}
        <div>
          <label className="block mb-1 font-medium">Old Password</label>
          <div className="relative">
            <Input
              type={showOld ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Old password"
              required
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-2 top-2 text-gray-500"
            >
              {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block mb-1 font-medium">New Password</label>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2 top-2 text-gray-500"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block mb-1 font-medium">Confirm New Password</label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2 top-2 text-gray-500"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Change Password"}
        </Button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
