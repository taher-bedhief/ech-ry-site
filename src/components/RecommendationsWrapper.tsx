"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import Recommendations from "./Recommendations";

export default function RecommendationsWrapper() {
  const currentUser = useSelector(
    (state: RootState) => state.auth.currentUser
  );

  const userId = currentUser?.email;

  if (!userId) return null;

  return <Recommendations userId={userId} />;
}
