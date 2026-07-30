"use client";

import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import RelativeTime from "@/components/custom/common/relative-time";
import {
  AccountType,
  ACCOUNT_TYPE_LABELS,
  UserDto,
} from "@/lib/api/schemas/auth-user";

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[];

interface IAdminUserRowProps {
  user: UserDto;
  isSelf: boolean;
  isUpdating: boolean;
  onAccountTypeChange: (userId: string, accountType: AccountType) => void;
  onDelete: (user: UserDto) => void;
}

export default function AdminUserRow({
  user,
  isSelf,
  isUpdating,
  onAccountTypeChange,
  onDelete,
}: IAdminUserRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.username || "-"}
        {isSelf && (
          <Badge variant="primary" className="ml-2">
            Ti
          </Badge>
        )}
      </TableCell>

      <TableCell className="text-muted-foreground">
        {user.email || "-"}
      </TableCell>

      <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
        <RelativeTime value={user.lastLoginAt} />
      </TableCell>

      <TableCell>
        <Select
          value={user.accountType}
          onValueChange={(value) =>
            onAccountTypeChange(user.id, value as AccountType)
          }
          disabled={isSelf || isUpdating}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {ACCOUNT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Obriši račun"
          className="text-destructive hover:text-destructive"
          disabled={isSelf}
          onClick={() => onDelete(user)}
        >
          <Trash2 className="size-6 sm:size-7" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
