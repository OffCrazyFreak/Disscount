"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  List,
  CreditCard,
  Search,
  Percent,
  Grid,
  MapPin,
  BarChart,
  LogIn,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BgAnimateButton } from "@/components/ui/bg-animate-button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: sidebar trigger + app name */}
          <div className="flex items-center space-x-3">
            <SidebarTrigger />
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-lg">Disscount</span>
            </Link>
          </div>

          {/* Center: shopping lists & digital cards */}
          <div className="flex items-center space-x-8 hidden sm:flex">
            <Link
              href="/shopping-lists"
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <ListChecks className="size-4 text-gray-500" />
              <span>Shopping liste</span>
            </Link>

            <Link
              href="/cards"
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <CreditCard className="size-4 text-gray-500" />
              <span>Digitalne kartice</span>
            </Link>
          </div>

          {/* Right: login button */}
          <div>
            <BgAnimateButton
              gradient={"forest"}
              rounded={"full"}
              animation="spin-slow"
              className="cursor-pointer"
              onClick={() => {
                console.log("Login button clicked");
                //TODO: open login modal from better-auth
              }}
            >
              <div className="flex items-center space-x-2">
                <LogIn className="size-6" />
                <span>Prijava</span>
              </div>
            </BgAnimateButton>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
