import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DangerZone() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      // First delete the user's profile
      const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', session.user.id);

      if (profileError) throw profileError;

      // Then delete all user's posts
      const { error: postsError } = await supabase
          .from('posts')
          .delete()
          .eq('author_id', session.user.id);

      if (postsError) throw postsError;

      // Finally, delete the user's auth account
      const { error: deleteError } = await supabase.auth.updateUser({
        data: { deleted: true }
      });

      if (deleteError) throw deleteError;

      await supabase.auth.signOut();
      queryClient.clear();
      navigate("/");
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete account. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}