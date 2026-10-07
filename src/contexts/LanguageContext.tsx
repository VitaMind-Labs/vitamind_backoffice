"use client";

import { createContext, useContext, type ReactNode } from "react";

const dictionary = {
  brand: "SynQ",
  auth: {
    badge: "Mental Wellness",
    helperTitle: "Your Well-being Journey",
    titleSignIn: "Welcome Back",
    titleSignUp: "Begin Your Journey",
    subtitleSignIn: "Sign in to continue your mental wellness journey.",
    subtitleSignUp: "Create your account and start your path to better mental health.",
    highlights: [
      "Personalized mental health assessments",
      "Expert-crafted questionnaires",
      "Progress tracking and insights",
    ],
    nickname: "Nickname",
    nicknamePlaceholder: "Enter your nickname",
    email: "Email Address",
    emailPlaceholder: "you@example.com",
    phone: "Phone Number",
    phonePlaceholder: "+1 (555) 000-0000",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Re-enter your password",
    signInButton: "Sign In",
    signUpButton: "Create Account",
    legal: "By continuing, you agree to our Terms of Service and Privacy Policy.",
    switchToSignIn: "Already have an account?",
    switchToSignUp: "Don't have an account?",
    switchSignInLink: "Sign in",
    switchSignUpLink: "Sign up",
    errors: {
      nickname: "Please enter your nickname.",
      email: "Please enter a valid email address.",
      phone: "Please enter a valid phone number.",
      password: "Password must be at least 8 characters.",
      confirmPassword: "Passwords do not match.",
    },
  },
};

type Dictionary = typeof dictionary;

interface LanguageContextValue {
  dictionary: Dictionary;
  direction: "ltr";
}

const LanguageContext = createContext<LanguageContextValue>({
  dictionary,
  direction: "ltr",
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  return (
    <LanguageContext.Provider value={{ dictionary, direction: "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
