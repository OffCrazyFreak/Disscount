import { AnimatedGroup } from "@/components/ui/animated-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HeroSection() {
  return (
    <section>
      <AnimatedGroup
        variants={{
          container: {
            visible: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.75,
              },
            },
          },
          item: {
            hidden: {
              opacity: 0,
              filter: "blur(12px)",
              y: 12,
            },
            visible: {
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
              transition: {
                type: "spring" as const,
                bounce: 0.3,
                duration: 1.5,
              },
            },
          },
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-sm md:w-auto mx-auto text-center"
      >
        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="text-2xl">💰</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardTitle className="text-lg">Najveća ušteda</CardTitle>
            <CardDescription className="text-gray-600 text-pretty">
              Usporedi cijene najvećih trgovina u Hrvatskoj
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="text-2xl">📋</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardTitle className="text-lg">Pametni popisi</CardTitle>
            <CardDescription className="text-gray-600 text-pretty">
              Kreiraj i dijeli popise za kupnju s obitelji
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="text-2xl">📈</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardTitle className="text-lg">Povijest cijena</CardTitle>
            <CardDescription className="text-gray-600 text-pretty">
              Prati povijest cijena i dobivaj obavijesti
            </CardDescription>
          </CardContent>
        </Card>
      </AnimatedGroup>
    </section>
  );
}
