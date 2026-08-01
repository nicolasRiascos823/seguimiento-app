"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SchedulesIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/schedules/group");
  }, [router]);
  return null;
}
