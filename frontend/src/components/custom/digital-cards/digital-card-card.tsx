"use client";

import { DigitalCardDto } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DigitalCardCardProps {
  digitalCard: DigitalCardDto;
  onEdit?: (digitalCard: DigitalCardDto) => void;
  onDelete?: (digitalCard: DigitalCardDto) => void;
  onCopy?: (digitalCard: DigitalCardDto) => void;
}

export default function DigitalCardCard({
  digitalCard,
  onEdit,
  onDelete,
  onCopy,
}: DigitalCardCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(digitalCard.value);
    onCopy?.(digitalCard);
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{digitalCard.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" className="text-xs">
              {digitalCard.type}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {digitalCard.codeType}
            </Badge>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(digitalCard)}>
              <Edit className="h-4 w-4 mr-2" />
              Uredi
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Kopiraj kod
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(digitalCard)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Obriši
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-lg p-3 bg-gray-50 rounded border"
          style={{ backgroundColor: digitalCard.color || undefined }}
        >
          {digitalCard.value}
        </div>

        {digitalCard.note && (
          <p className="text-sm text-gray-600">{digitalCard.note}</p>
        )}

        <p className="text-xs text-gray-500">
          Stvoreno {new Date(digitalCard.createdAt).toLocaleDateString("hr-HR")}
        </p>
      </div>
    </Card>
  );
}
