import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LineButton } from "@/components/ui/line-button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { insertUserSchema } from "@shared/schema";
import { getLINEProfile, isLINELoggedIn } from "@/lib/line";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";

// Extend the schema with custom validations
const registerFormSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val, {
    message: "You must agree to the terms and conditions"
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type RegisterForm = z.infer<typeof registerFormSchema>;

export default function RegisterPage({ liff }: { liff: any }) {
  const [, navigate] = useLocation();
  const { register: registerUser, registerWithLINE } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLineConnected, setIsLineConnected] = useState(false);
  const [lineProfile, setLineProfile] = useState<any>(null);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      agreeToTerms: false
    }
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsSubmitting(true);
      
      // If user has LINE connected, use LINE registration
      if (isLineConnected && lineProfile) {
        // Register with LINE - only need email and optional phone/DOB from form
        await registerWithLINE(liff, {
          email: data.email,
          phoneNumber: data.phoneNumber || undefined,
          dateOfBirth: data.dateOfBirth || undefined,
        });
      } else {
        // Standard registration with username/password
        // Remove confirmPassword and agreeToTerms before sending to API
        const { confirmPassword, agreeToTerms, ...userData } = data;
        await registerUser(userData);
      }
      
      // Regardless of registration method, redirect to payment registration
      navigate("/payment-registration");
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user is already connected to LINE when component mounts
  useEffect(() => {
    const checkLineConnection = async () => {
      if (liff && isLINELoggedIn(liff)) {
        const profile = await getLINEProfile(liff);
        if (profile) {
          setIsLineConnected(true);
          setLineProfile(profile);
          
          // Prefill the form with LINE profile data if available
          form.setValue("fullName", profile.displayName);
          // We don't have email from LINE so it still needs to be provided by user
        }
      }
    };
    
    checkLineConnection();
  }, [liff, form]);

  return (
    <div className="min-h-screen bg-white p-5">
      <div className="flex items-center mb-6">
        <button 
          className="text-gray-900"
          onClick={() => navigate("/onboarding")}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold mx-auto">Create Account</h1>
      </div>
      
      {isLineConnected && lineProfile && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">LINE Account Connected</AlertTitle>
          <AlertDescription className="text-green-700">
            Your LINE account ({lineProfile.displayName}) is connected. Complete the form to register.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="border-none shadow-none">
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mb-8">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Your name" 
                        className="border-gray-200 focus:border-[#06C755] focus:ring-[#06C755]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600">Email</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email" 
                        placeholder="your.email@example.com"
                        className="border-gray-200 focus:border-[#06C755] focus:ring-[#06C755]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600">Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="tel" 
                        placeholder="+1 (123) 456-7890"
                        className="border-gray-200 focus:border-[#06C755] focus:ring-[#06C755]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600">Date of Birth</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date" 
                        className="border-gray-200 focus:border-[#06C755] focus:ring-[#06C755]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600">Username</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Choose a username"
                        className="border-gray-200 focus:border-[#06C755] focus:ring-[#06C755]"
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
                    <FormLabel className="text-gray-600">Password</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="••••••••"
                        className="border-gray-200 focus:border-[#06C755] focus:ring-[#06C755]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-600">Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="••••••••"
                        className="border-gray-200 focus:border-[#06C755] focus:ring-[#06C755]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        className="mt-1 data-[state=checked]:bg-[#06C755] data-[state=checked]:border-[#06C755]"
                      />
                    </FormControl>
                    <div className="leading-none">
                      <FormLabel className="text-sm text-gray-600">
                        I agree to the{" "}
                        <a href="/terms" className="text-[#06C755]">Terms of Service</a>
                        {" "}and{" "}
                        <a href="/terms" className="text-[#06C755]">Privacy Policy</a>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <LineButton
                type="submit"
                variant="primary"
                fullWidth
                className="py-3 mt-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Continue to Payment"}
              </LineButton>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
