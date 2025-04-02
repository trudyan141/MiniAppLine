import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { LineButton } from "@/components/ui/line-button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLINELoggedIn } from "@/lib/line";

export default function LoginPage({ liff }: { liff: any }) {
  const [, navigate] = useLocation();
  const { login, loginWithLINE } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await login(username, password);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithLINE = async () => {
    try {
      setIsLoading(true);
      
      // Try to login with LINE
      await loginWithLINE(liff);
      
      // If successful, navigate to home
      navigate("/");
    } catch (error: any) {
      // Handle specific errors
      if (error.message === "LINE_NOT_REGISTERED") {
        // If LINE account is not registered, redirect to register page
        navigate("/register");
      } else {
        toast({
          title: "LINE Login Error",
          description: "There was an error logging in with LINE. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-48 bg-[#06C755] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/10 to-gray-900/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-3xl font-bold text-white">Time Cafe</h1>
          <p className="text-white mt-2">Login to your account</p>
        </div>
      </div>
      
      <Card className="p-5 bg-white rounded-t-3xl -mt-6 shadow-lg border-none">
        <CardContent className="p-0">
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            
            <LineButton
              type="submit"
              variant="primary"
              fullWidth
              className="py-3 mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </LineButton>
          </form>
          
          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-gray-200 flex-grow"></div>
            <div className="mx-4 text-gray-500 text-sm">or</div>
            <div className="border-t border-gray-200 flex-grow"></div>
          </div>
          
          <LineButton
            onClick={handleLoginWithLINE}
            variant="outline"
            fullWidth
            className="py-3 mb-4"
          >
            Continue with LINE
          </LineButton>
          
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a 
              className="text-[#06C755] font-medium cursor-pointer"
              onClick={() => navigate("/register")}
            >
              Register
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}