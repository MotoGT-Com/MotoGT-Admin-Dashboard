"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated by checking localStorage
    const token = localStorage.getItem("token");

    if (token) {
      // User is authenticated, redirect to dashboard
      router.replace("/dashboard");
    } else {
      // User is not authenticated, redirect to login
      router.replace("/login");
    }
  }, [router]);

  return null;
}
