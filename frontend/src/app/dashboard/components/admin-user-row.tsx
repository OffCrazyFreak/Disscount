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
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import PendingStatus from "@/components/custom/common/pending-status";
import { LOADING_LABELS } from "@/constants/loading-labels";
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
        {/* A select has nowhere to put pending copy, so the spinner sits beside
            it and the live region carries the wording. */}
        <div className="flex items-center gap-2">
          <Select
            value={user.accountType}
            onValueChange={(value) =>
              onAccountTypeChange(user.id, value as AccountType)
            }
            disabled={isSelf || isUpdating}
          >
            <SelectTrigger className="w-full" aria-busy={isUpdating}>
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

          {isUpdating && <BlockLoadingSpinner size={16} />}
          <PendingStatus pending={isUpdating} label={LOADING_LABELS.updating} />
        </div>
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
          <Trash2 />
        </Button>
      </TableCell>
    </TableRow>
  );
}
