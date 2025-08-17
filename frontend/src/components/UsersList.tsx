"use client";

import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

type User = {
  id: string;
  username?: string;
  email?: string;
};

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get("/api/users");
  return res.data;
}

export default function UsersList() {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<
    User[],
    Error
  >({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  if (isLoading) return <div className="p-4">Loading users…</div>;
  if (isError)
    return <div className="p-4 text-red-600">Error: {error?.message}</div>;

  return (
    <div className="p-4 w-full max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">All users</h3>
        <button
          onClick={() => refetch()}
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <ul className="list-disc pl-5 space-y-1">
        {data && data.length ? (
          data.map((u) => (
            <li key={u.id} className="text-sm">
              {u.username ?? u.email ?? u.id}
            </li>
          ))
        ) : (
          <li className="text-sm text-gray-500">No users found</li>
        )}
      </ul>
    </div>
  );
}
