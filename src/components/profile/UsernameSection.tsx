import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function UsernameSection({ profile }: { profile: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    if (username === profile?.username) {
      setUsernameAvailable(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (error) {
        console.error("Error checking username:", error);
        return;
      }

      setUsernameAvailable(data === null);
    } catch (error) {
      console.error("Error checking username:", error);
    }
  };

  const handleUsernameChange = async () => {
    if (!usernameAvailable || !newUsername) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: newUsername })
        .eq("id", profile.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Username updated",
        description: "Your username has been successfully updated.",
      });
      setNewUsername("");
      setUsernameAvailable(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update username. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Change Username</h2>
      <div className="flex gap-4">
        <Input
          type="text"
          placeholder="New username"
          value={newUsername}
          onChange={(e) => {
            setNewUsername(e.target.value);
            checkUsername(e.target.value);
          }}
          className={
            usernameAvailable !== null
              ? usernameAvailable
                ? "border-green-500"
                : "border-red-500"
              : ""
          }
        />
        <Button 
          onClick={handleUsernameChange}
          disabled={loading || !usernameAvailable || !newUsername}
        >
          Update Username
        </Button>
      </div>
      {newUsername.length >= 3 && usernameAvailable !== null && (
        <p className={`text-sm ${
          usernameAvailable ? "text-green-600" : "text-red-600"
        }`}>
          {usernameAvailable
            ? "Username is available"
            : "Username is already taken"}
        </p>
      )}
    </div>
  );
}