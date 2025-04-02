import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { LineButton } from "@/components/ui/line-button";

export default function TermsPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white p-5">
      <div className="flex items-center mb-6">
        <button 
          className="text-gray-900"
          onClick={() => navigate(-1)}
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
        <h1 className="text-xl font-bold mx-auto">Terms of Service</h1>
      </div>
      
      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-5">
          <div className="prose max-w-none">
            <h2 className="text-lg font-bold mb-4">Time Cafe Terms of Service</h2>
            
            <h3 className="font-bold mt-4 mb-2">1. Service Overview</h3>
            <p className="text-sm text-gray-600 mb-3">
              Time Cafe provides a time-based pay-per-use restaurant service. Users are charged based on the time spent at the café, plus any food and beverages ordered during their visit.
            </p>
            
            <h3 className="font-bold mt-4 mb-2">2. Registration and Account</h3>
            <p className="text-sm text-gray-600 mb-3">
              Users must register with accurate personal information. Each user must be at least 18 years old and have a valid payment method. You are responsible for maintaining the confidentiality of your account information.
            </p>
            
            <h3 className="font-bold mt-4 mb-2">3. Payment Terms</h3>
            <p className="text-sm text-gray-600 mb-3">
              Time Cafe charges a fee based on the time spent at the café (¥500 for the first hour, then ¥8 per minute, with a daily maximum of ¥2,000), plus any food or beverages ordered. By agreeing to these terms, you authorize us to charge your registered payment method.
            </p>
            
            <h3 className="font-bold mt-4 mb-2">4. Check-in and Check-out</h3>
            <p className="text-sm text-gray-600 mb-3">
              Users must check in upon arrival by scanning the QR code provided at the entrance. Similarly, users must check out before leaving by scanning the QR code. Failure to check out will result in continued charges until the system automatically closes your session at closing time.
            </p>
            
            <h3 className="font-bold mt-4 mb-2">5. Ordering</h3>
            <p className="text-sm text-gray-600 mb-3">
              All food and beverage orders must be placed through the app. Orders will be added to your total bill and charged during checkout.
            </p>
            
            <h3 className="font-bold mt-4 mb-2">6. Conduct</h3>
            <p className="text-sm text-gray-600 mb-3">
              Users must maintain appropriate behavior while at Time Cafe. The management reserves the right to ask any user to leave for inappropriate conduct, and the user will be charged for the time spent up to that point.
            </p>
            
            <h3 className="font-bold mt-4 mb-2">7. Privacy Policy</h3>
            <p className="text-sm text-gray-600 mb-3">
              Time Cafe collects and processes personal data in accordance with our Privacy Policy, which is incorporated by reference into these Terms of Service.
            </p>
            
            <h3 className="font-bold mt-4 mb-2">8. Promotions and Coupons</h3>
            <p className="text-sm text-gray-600 mb-3">
              Time Cafe may offer promotions and coupons, including birthday specials. These offers are subject to their specific terms and conditions.
            </p>
            
            <h3 className="font-bold mt-4 mb-2">9. Termination</h3>
            <p className="text-sm text-gray-600 mb-3">
              Time Cafe reserves the right to terminate or suspend any user account for violations of these terms or for any other reason at our discretion.
            </p>
            
            <h3 className="font-bold mt-4 mb-2">10. Changes to Terms</h3>
            <p className="text-sm text-gray-600 mb-3">
              Time Cafe may modify these terms at any time. Continued use of our services after such modifications constitutes acceptance of the updated terms.
            </p>
            
            <p className="text-sm text-gray-600 mt-6">
              By using Time Cafe's services, you agree to abide by these Terms of Service.
            </p>
            
            <p className="text-sm text-gray-600 mt-4">
              Last updated: June 25, 2023
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        <LineButton
          variant="primary"
          fullWidth
          className="py-3"
          onClick={() => navigate(-1)}
        >
          I Understand and Accept
        </LineButton>
      </div>
    </div>
  );
}
