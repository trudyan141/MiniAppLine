import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import OnboardingPage from "@/pages/onboarding";
import RegisterPage from "@/pages/register";
import LoginPage from "@/pages/login";
import PaymentRegistrationPage from "@/pages/payment-registration";
import HomePage from "@/pages/home";
import CheckInPage from "@/pages/check-in";
import ActiveSessionPage from "@/pages/active-session";
import MenuPage from "@/pages/menu";
import CheckoutScanPage from "@/pages/checkout-scan";
import CheckoutPage from "@/pages/checkout";
import SuccessPage from "@/pages/success";
import ProfilePage from "@/pages/profile";
import ActivityPage from "@/pages/activity";
import TermsPage from "@/pages/terms";
import MainLayout from "@/components/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { AuthProvider } from "./contexts/AuthContext";
import { SessionProvider } from "./contexts/SessionContext";

function AppRoutes({ liff }: { liff: any }) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Redirect based on auth state
    if (!isLoading) {
      if (!user && 
          !location.startsWith("/onboarding") && 
          !location.startsWith("/register") && 
          !location.startsWith("/login") &&
          !location.startsWith("/terms")) {
        // If user tries to check-in without being logged in, redirect to login first
        if (location.startsWith("/check-in")) {
          setLocation("/login");
        } else {
          setLocation("/onboarding");
        }
      }
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/onboarding" component={() => <OnboardingPage liff={liff} />} />
      <Route path="/register" component={() => <RegisterPage liff={liff} />} />
      <Route path="/login" component={() => <LoginPage liff={liff} />} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/payment-registration" component={PaymentRegistrationPage} />
      
      <Route path="/">
        <MainLayout>
          <HomePage />
        </MainLayout>
      </Route>
      
      <Route path="/check-in">
        <MainLayout showNavigation={false}>
          <CheckInPage liff={liff} />
        </MainLayout>
      </Route>
      
      <Route path="/active-session">
        <MainLayout>
          <ActiveSessionPage />
        </MainLayout>
      </Route>
      
      <Route path="/menu">
        <MainLayout>
          <MenuPage />
        </MainLayout>
      </Route>
      
      <Route path="/checkout-scan">
        <MainLayout showNavigation={false}>
          <CheckoutScanPage />
        </MainLayout>
      </Route>
      
      <Route path="/checkout">
        <MainLayout showNavigation={false}>
          <CheckoutPage />
        </MainLayout>
      </Route>
      
      <Route path="/success">
        <MainLayout showNavigation={false}>
          <SuccessPage />
        </MainLayout>
      </Route>
      
      <Route path="/profile">
        <MainLayout>
          <ProfilePage />
        </MainLayout>
      </Route>
      
      <Route path="/activity">
        <MainLayout>
          <ActivityPage />
        </MainLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App({ liff, basePath }: { liff: any, basePath: string }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Sử dụng WouterRouter với base path để tất cả các route đều có tiền tố /MiniAppLine/ */}
      <WouterRouter base={basePath}>
        <AuthProvider>
          <SessionProvider>
            <AppRoutes liff={liff} />
            <Toaster />
          </SessionProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
