import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import NotFoundClient from "@/app/not-found/components/not-found-client";
import { Suspense } from "react";
import type { Metadata } from "next";

const metadata: Metadata = {
  title: "Stranica nije pronađena - 404",
  description: "Stranica koju tražite ne postoji.",
};

export default function NotFound() {
  return (
    <div className="m-2 flex items-center justify-center min-h-[70dvh]">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4 text-muted-foreground">
          <CardTitle>
            <div className="text-6xl font-bold">404</div>

            <div className="text-2xl">Hmm… ovo je neugodno. 😅</div>
          </CardTitle>

          <CardDescription className="space-y-2">
            <div>
              Čini se da stranica
              <Suspense>
                <NotFoundClient />
              </Suspense>
              ne postoji.
            </div>

            <div className="text-gray-600">
              Vratimo se skupa na početnu stranicu, ili prijavi grešku!
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center mt-2 flex flex-wrap gap-4 items-center justify-center">
          <Button variant={"outline"} effect={"shineHover"} asChild>
            <Link href="/">Prijavi grešku</Link>
            {/* TODO: contact form */}
          </Button>

          <Button
            asChild
            effect={"shineHover"}
            className="text-pretty whitespace-wrap"
          >
            <Link href="/" className="text-pretty whitespace-wrap">
              Povratak na početnu
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
