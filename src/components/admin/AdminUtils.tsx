
import React, { useState } from "react";
import { makeUserAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminUtils = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("nandoesporte1@gmail.com");
  const [loading, setLoading] = useState(false);

  const handleMakeUserAdmin = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      await makeUserAdmin(email);
      
      toast({
        title: "Success!",
        description: `${email} is now an administrator.`,
      });
    } catch (error: any) {
      console.error('Error making user admin:', error);
      toast({
        title: "Error!",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Utilities</CardTitle>
        <CardDescription>
          Make a user an administrator
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="User email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleMakeUserAdmin} disabled={loading}>
            {loading ? "Processing..." : "Make Admin"}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        This action will give the user full administrative privileges.
      </CardFooter>
    </Card>
  );
};
