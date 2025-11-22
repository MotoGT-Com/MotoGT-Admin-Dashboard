"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { userService, User } from "@/lib/services/user.service";
import { useToast } from "@/hooks/use-toast";

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = params.id as string;

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await userService.getUserById(userId);
        setUser(userData);
      } catch (error: any) {
        console.error("Failed to fetch user:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch user details",
          variant: "destructive",
        });
        // Redirect back if user not found
        setTimeout(() => router.back(), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.id]);

  const handleVerificationToggle = async () => {
    if (!user) return;

    try {
      if (user.emailVerified) {
        await userService.unverifyUser(user.id);
        toast({
          title: "Success",
          description: "User email unverified successfully",
        });
      } else {
        await userService.verifyUser(user.id);
        toast({
          title: "Success",
          description: "User email verified successfully",
        });
      }

      // Refresh user data
      const updatedUser = await userService.getUserById(userId);
      setUser(updatedUser);
    } catch (error: any) {
      console.error("Failed to toggle verification:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update verification status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFullName = (user: User) => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName} ${lastName}`.trim() || "N/A";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Details</h1>
            <p className="text-muted-foreground mt-1">
              View and manage user information
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleVerificationToggle}>
            {user.emailVerified ? (
              <ShieldX size={16} className="mr-2" />
            ) : (
              <ShieldCheck size={16} className="mr-2" />
            )}
            {user.emailVerified ? "Unverify Email" : "Verify Email"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="text-xs font-mono mt-1 break-all">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">First Name</p>
              <p className="text-sm font-medium mt-1">
                {user.firstName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Name</p>
              <p className="text-sm font-medium mt-1">
                {user.lastName || "N/A"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm mt-1">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-sm mt-1">{user.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="text-sm mt-1">{user.gender || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="text-sm mt-1">
                {user.dateOfBirth
                  ? new Date(user.dateOfBirth).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge
                variant="outline"
                className={`mt-1 ${
                  user.role === "admin"
                    ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                }`}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant="outline"
                className={`mt-1 ${
                  user.status === "active"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : user.status === "suspended"
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Verified</p>
              <Badge
                variant="outline"
                className={`mt-1 ${
                  user.emailVerified
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {user.emailVerified ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Verified At</p>
              <p className="text-sm mt-1">{formatDate(user.emailVerifiedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="text-sm mt-1">{formatDate(user.lastLoginAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm mt-1">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Updated</p>
              <p className="text-sm mt-1">{formatDate(user.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note about additional features */}
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">
            Additional features like orders, cart, garage, and activity logs can
            be integrated when those APIs are available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
