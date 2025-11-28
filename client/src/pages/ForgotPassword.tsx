import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, ArrowLeft, ArrowRight, CheckCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { PasswordInput } from "@/components/PasswordInput";
import { OTPInput } from "@/components/OTPInput";
import { useToast } from "@/hooks/use-toast";
import { forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { z } from "zod";

type Step = "request" | "otp" | "reset" | "success";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("request");
  const [method, setMethod] = useState<"email" | "mobile">("email");
  const [identifier, setIdentifier] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const requestForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      identifier: "",
      method: "email",
    },
  });

  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onRequestOTP = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, method }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send OTP");
      }

      setIdentifier(data.identifier);
      setStep("otp");
      toast({
        title: "OTP Sent!",
        description: `Verification code sent to your ${method}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          code: otpValue,
          method,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Invalid OTP");
      }

      setStep("reset");
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: z.infer<typeof resetPasswordSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          method,
          code: otpValue,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to reset password");
      }

      setStep("success");
      toast({
        title: "Password Reset!",
        description: "Your password has been changed successfully.",
      });

      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          identifier, 
          method 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend OTP");
      }

      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-home">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {step === "request" && "Forgot Password"}
              {step === "otp" && "Verify OTP"}
              {step === "reset" && "Reset Password"}
              {step === "success" && "Success!"}
            </CardTitle>
            <CardDescription>
              {step === "request" && "Choose how to receive your reset code"}
              {step === "otp" && `Enter the code sent to your ${method}`}
              {step === "reset" && "Create a new password"}
              {step === "success" && "Your password has been reset"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "request" && (
              <>
                <Tabs 
                  value={method} 
                  onValueChange={(v) => setMethod(v as "email" | "mobile")}
                  className="mb-6"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email" data-testid="tab-email">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="mobile" data-testid="tab-mobile">
                      <Phone className="h-4 w-4 mr-2" />
                      Mobile
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Form {...requestForm}>
                  <form onSubmit={requestForm.handleSubmit(onRequestOTP)} className="space-y-4">
                    <FormField
                      control={requestForm.control}
                      name="identifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{method === "email" ? "Email Address" : "Mobile Number"}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              {method === "email" ? (
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              )}
                              <Input 
                                placeholder={method === "email" ? "your.email@example.com" : "+91 XXXXX XXXXX"}
                                className={`pl-10 ${method === "mobile" ? "font-mono" : ""}`}
                                data-testid="input-identifier"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                      data-testid="button-send-otp"
                    >
                      {isLoading ? "Sending..." : "Send Reset Code"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </form>
                </Form>
              </>
            )}

            {step === "otp" && (
              <div className="space-y-6">
                <OTPInput
                  value={otpValue}
                  onChange={setOtpValue}
                  disabled={isLoading}
                />
                <Button 
                  onClick={onVerifyOTP}
                  className="w-full" 
                  disabled={isLoading || otpValue.length !== 6}
                  data-testid="button-verify-otp"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep("request");
                      setOtpValue("");
                    }}
                    disabled={isLoading}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resendOTP}
                    disabled={isLoading}
                    data-testid="button-resend-otp"
                  >
                    Resend Code
                  </Button>
                </div>
              </div>
            )}

            {step === "reset" && (
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <PasswordInput 
                            placeholder="Create new password"
                            data-testid="input-new-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <PasswordInput 
                            placeholder="Confirm new password"
                            data-testid="input-confirm-new-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    data-testid="button-reset-password"
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center py-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-center text-muted-foreground mb-4">
                  Redirecting to login...
                </p>
              </div>
            )}

            {step === "request" && (
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Remember your password? </span>
                <Link href="/login">
                  <a className="text-primary hover:underline font-medium" data-testid="link-login">
                    Sign In
                  </a>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
