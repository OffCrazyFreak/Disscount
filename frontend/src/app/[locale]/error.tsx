"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { handleBoundaryError } from "@/lib/handle-boundary-error";

interface IRouteErrorProps {
  error: unknown;
  retry: () => void;
}

export default function RouteError({ error, retry }: IRouteErrorProps) {
  const t = useTranslations("errorPage");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    handleBoundaryError(error);
  }, [error]);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="m-2 flex items-center justify-center min-h-[70dvh]">
      <Card className="w-full max-w-md mx-auto py-8">
        <CardHeader className="text-center space-y-4 text-muted-foreground">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-semibold leading-tight text-foreground outline-none"
          >
            {t("title")}
          </h1>

          <CardDescription className="text-pretty">
            {t("description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center mt-2 flex flex-wrap gap-4 items-center justify-center">
          <Button variant="outline" onClick={retry}>
            {t("retry")}
          </Button>

          <Button asChild>
            <Link href="/">{t("home")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
